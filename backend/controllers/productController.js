// Get all products with filters
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const db = req.app.get('db');
    const cache = req.app.get('cache');

    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // Try cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        ...JSON.parse(cached)
      });
    }

    // Build query
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (minPrice) {
      params.push(minPrice);
      query += ` AND price >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(maxPrice);
      query += ` AND price <= $${params.length}`;
    }

    // Sorting
    const sortOptions = {
      'price_asc': 'price ASC',
      'price_desc': 'price DESC',
      'name_asc': 'name ASC',
      'name_desc': 'name DESC',
      'newest': 'created_at DESC'
    };
    query += ` ORDER BY ${sortOptions[sort] || 'created_at DESC'}`;

    // Pagination
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    // Get products
    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM products WHERE 1=1';
    const countParams = [];

    if (category && category !== 'all') {
      countParams.push(category);
      countQuery += ` AND category = $${countParams.length}`;
    }

    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (name ILIKE $${countParams.length} OR description ILIKE $${countParams.length})`;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const response = {
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Cache for 5 minutes
    await cache.setEx(cacheKey, 300, JSON.stringify(response));

    res.json({
      source: 'database',
      ...response
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');
    const cache = req.app.get('cache');

    const cacheKey = `product:${id}`;

    // Try cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        product: JSON.parse(cached)
      });
    }

    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Cache for 10 minutes
    await cache.setEx(cacheKey, 600, JSON.stringify(result.rows[0]));

    res.json({
      source: 'database',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const db = req.app.get('db');

    const result = await db.query(
      'SELECT category, COUNT(*) as count FROM products GROUP BY category ORDER BY category'
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};