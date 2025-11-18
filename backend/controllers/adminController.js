// backend/controllers/adminController.js

// Admin Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const db = req.app.get('db');

    // Get various statistics
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'processing') as processing_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'delivered') as delivered_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
         WHERE status != 'cancelled' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_last_30_days,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders 
         WHERE status != 'cancelled' AND created_at >= CURRENT_DATE - INTERVAL '7 days') as revenue_last_7_days,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status != 'cancelled') as average_order_value
    `);

    // Get top selling products
    const topProducts = await db.query(`
      SELECT p.id, p.name, p.image, SUM(oi.quantity) as total_sold
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.image
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Get recent orders
    const recentOrders = await db.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // Get low stock products
    const lowStockProducts = await db.query(`
      SELECT id, name, stock, category
      FROM products
      WHERE stock < 10
      ORDER BY stock ASC
      LIMIT 10
    `);

    // Sales by category
    const salesByCategory = await db.query(`
      SELECT p.category, COUNT(DISTINCT o.id) as order_count, SUM(oi.quantity * oi.price) as total_sales
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.category
      ORDER BY total_sales DESC
    `);

    res.json({
      stats: stats.rows[0],
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
      lowStockProducts: lowStockProducts.rows,
      salesByCategory: salesByCategory.rows
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
};

// Product Management - Create Product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image } = req.body;
    const db = req.app.get('db');

    // Validate
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const result = await db.query(
      `INSERT INTO products (name, description, price, category, stock, image) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, price, category, stock || 0, image]
    );

    // Clear cache
    const cache = req.app.get('cache');
    await cache.del(await cache.keys('products:*'));

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Product Management - Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, image } = req.body;
    const db = req.app.get('db');

    const result = await db.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category = COALESCE($4, category),
           stock = COALESCE($5, stock),
           image = COALESCE($6, image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 
       RETURNING *`,
      [name, description, price, category, stock, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Clear cache
    const cache = req.app.get('cache');
    await cache.del(await cache.keys('products:*'));
    await cache.del(`product:${id}`);

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Product Management - Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');

    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Clear cache
    const cache = req.app.get('cache');
    await cache.del(await cache.keys('products:*'));
    await cache.del(`product:${id}`);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Order Management - Get All Orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const db = req.app.get('db');

    let query = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ` GROUP BY o.id, u.name, u.email ORDER BY o.created_at DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

// Order Management - Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = req.app.get('db');

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// User Management - Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const db = req.app.get('db');

    let query = 'SELECT id, name, email, role, created_at, last_login FROM users WHERE 1=1';
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// User Management - Update User Role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const db = req.app.get('db');

    const validRoles = ['customer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Analytics - Sales Report
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = req.app.get('db');

    const result = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as average_order_value
       FROM orders
       WHERE status != 'cancelled'
         AND created_at >= $1
         AND created_at <= $2
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [startDate || '2000-01-01', endDate || '2099-12-31']
    );

    res.json({ report: result.rows });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ error: 'Failed to get sales report' });
  }
};