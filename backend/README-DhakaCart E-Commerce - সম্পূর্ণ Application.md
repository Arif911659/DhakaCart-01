# 🛒 DhakaCart E-Commerce - সম্পূর্ণ Application

## 📦 Quick Start - 5 Minutes Setup

```bash
# 1. Clone or create project
mkdir dhakacart && cd dhakacart

# 2. Download complete code (I'll provide)
# Just run this command:
docker-compose up -d

# 3. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Admin: http://localhost:3000/admin
```

---

# 📁 Complete Project Structure

```
dhakacart/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── adminController.js
│   │   └── paymentController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── adminRoutes.js
│   │   └── paymentRoutes.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── utils/
│   │   ├── jwtHelper.js
│   │   ├── emailService.js
│   │   └── invoiceGenerator.js
│   ├── config/
│   │   └── database.js
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── ProductDetailPage.js
│   │   │   ├── CartPage.js
│   │   │   ├── CheckoutPage.js
│   │   │   ├── OrderConfirmationPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ProfilePage.js
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.js
│   │   │       ├── ProductManagement.js
│   │   │       ├── OrderManagement.js
│   │   │       ├── UserManagement.js
│   │   │       └── Analytics.js
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProductCard.js
│   │   │   ├── CartItem.js
│   │   │   ├── OrderCard.js
│   │   │   ├── Footer.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   ├── CartContext.js
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── HomePage.css
│   │   │   ├── ProductCard.css
│   │   │   ├── CartPage.css
│   │   │   ├── CheckoutPage.css
│   │   │   └── AdminDashboard.css
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   └── secrets.yaml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🎯 Step 1: VS Code এ Setup করুন

## Terminal Commands:

```bash
# 1. Create main directory
mkdir dhakacart
cd dhakacart

# 2. Initialize git
git init

# 3. Create all folders
mkdir -p backend/controllers backend/middleware backend/routes backend/models backend/utils backend/config
mkdir -p frontend/src/pages/admin frontend/src/components frontend/src/context frontend/src/services frontend/src/styles
mkdir -p database/migrations
mkdir -p k8s
mkdir -p .github/workflows

# 4. Open in VS Code
code .
```

---

# 📝 BACKEND FILES - Copy এই files গুলো

## File 1: `backend/package.json`

```json
{
  "name": "dhakacart-backend",
  "version": "1.0.0",
  "description": "DhakaCart E-commerce Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.7",
    "pdfkit": "^0.13.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
```

## File 2: `backend/server.js`

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const redis = require('redis');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dhakacart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis Connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

// Connect Redis
(async () => {
  await redisClient.connect();
})();

// Make available globally
app.set('db', pool);
app.set('cache', redisClient);

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Health Check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const ping = await redisClient.ping();
    res.json({
      status: 'healthy',
      database: 'connected',
      cache: ping === 'PONG' ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 DhakaCart Backend running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await pool.end();
  await redisClient.quit();
  process.exit(0);
});

module.exports = app;
```

## File 3: `backend/controllers/authController.js`

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const db = req.app.get('db');

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'customer']
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.get('db');

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get Current User
exports.getCurrentUser = async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const result = await db.query(
      'SELECT id, name, email, role, created_at, last_login FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const db = req.app.get('db');

    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone), 
           address = COALESCE($3, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, name, email, phone, address, role`,
      [name, phone, address, req.user.userId]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = req.app.get('db');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current password
    const result = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = result.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
```

## File 4: `backend/controllers/productController.js`

```javascript
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
```

এই guide অনেক বড় হয়ে যাচ্ছে! আমি এখন একটা **Complete ZIP Structure** এর মতো করে সব files একসাথে দিচ্ছি।

আপনি কি চান আমি:
1. **বাকি সব backend files** (orders, admin, payment controllers)
2. **সম্পূর্ণ Frontend React code** (সব pages + components)
3. **Database Schema** (Complete SQL)
4. **Docker Compose** (One command setup)
5. **Kubernetes manifests** (K8s deployment)

**সব একসাথে continue করব?** নাকি এগুলো আলাদা artifacts এ ভাগ করে দিব? 🚀