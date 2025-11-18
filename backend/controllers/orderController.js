// backend/controllers/orderController.js

// Create Order
exports.createOrder = async (req, res) => {
  const client = await req.app.get('db').connect();
  
  try {
    const { items, shipping_address, payment_method } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!shipping_address) {
      return res.status(400).json({ error: 'Shipping address required' });
    }

    await client.query('BEGIN');

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Get product details
      const productResult = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];

      // Check stock
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // Update stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, product.id]
      );

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: itemTotal
      });
    }

    // Add shipping cost
    const shippingCost = 100;
    totalAmount += shippingCost;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method, status, shipping_cost) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, totalAmount, shipping_address, payment_method, 'pending', shippingCost]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    // Clear cache
    const cache = req.app.get('cache');
    const keys = await cache.keys('products:*');
    if (keys.length > 0) {
      await cache.del(keys);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    client.release();
  }
};

// Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = req.app.get('db');

    const result = await db.query(
      `SELECT 
        o.*,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.quantity * oi.price
          )
        ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
};

// Get Single Order
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const db = req.app.get('db');

    const result = await db.query(
      `SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.quantity * oi.price,
            'image', p.image
          )
        ) as items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id, u.name, u.email`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order' });
  }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
  const client = await req.app.get('db').connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await client.query('BEGIN');

    // Get order
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    if (order.status !== 'pending' && order.status !== 'processing') {
      throw new Error('Order cannot be cancelled');
    }

    // Restore stock
    const itemsResult = await client.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
      [id]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Update order status
    await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Order cancelled successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel order error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel order' });
  } finally {
    client.release();
  }
};

// Get Order Statistics
exports.getOrderStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = req.app.get('db');

    const result = await db.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) as total_spent
       FROM orders
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ stats: result.rows[0] });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Failed to get order statistics' });
  }
};