# 🛒 DhakaCart E-Commerce - VS Code সম্পূর্ণ গাইড

## 📋 Table of Contents
1. [Initial Setup](#step-0-initial-setup)
2. [Step 1: Frontend - Product Catalog](#step-1-frontend-product-catalog)
3. [Step 2: Backend API](#step-2-backend-api)
4. [Step 3: Database Schema](#step-3-database-schema)
5. [Step 4: Authentication](#step-4-authentication)
6. [Step 5: Admin Dashboard](#step-5-admin-dashboard)
7. [Step 6: Payment Integration](#step-6-payment-integration)
8. [Step 7: DevOps Setup](#step-7-devops-setup)

---

# Step 0: Initial Setup (শুরু করার আগে)

## VS Code খুলুন এবং Terminal এ এই commands গুলো run করুন:

```bash
# 1. প্রজেক্ট ফোল্ডার তৈরি করুন
mkdir dhakacart
cd dhakacart

# 2. Main folders তৈরি করুন
mkdir backend frontend database

# 3. VS Code এ open করুন
code .
```

## Required VS Code Extensions Install করুন:
1. `ES7+ React/Redux/React-Native snippets`
2. `Prettier - Code formatter`
3. `ESLint`
4. `Docker`
5. `Thunder Client` (API testing জন্য)

---

# Step 1: Frontend - Product Catalog, Cart & Checkout

## 📁 Frontend Folder Structure তৈরি করুন:

### Terminal এ run করুন:
```bash
cd frontend
npx create-react-app .
```

### Folder structure এভাবে organize করুন:
```
frontend/
├── public/
├── src/
│   ├── pages/
│   │   ├── HomePage.js
│   │   ├── ProductDetailPage.js
│   │   ├── CartPage.js
│   │   ├── CheckoutPage.js
│   │   └── OrderConfirmationPage.js
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── ProductCard.js
│   │   ├── CartItem.js
│   │   └── Footer.js
│   ├── context/
│   │   └── CartContext.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   └── index.js
└── package.json
```

---

## 📝 File 1: `src/pages/HomePage.js` তৈরি করুন

**VS Code এ New File → `src/pages/HomePage.js`**

```javascript
import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/api';
import '../styles/HomePage.css';

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, [category, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts({ category, search: searchQuery });
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to DhakaCart</h1>
        <p>Your One-Stop Electronics Shop in Dhaka</p>
      </div>

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          <option value="all">All Categories</option>
          <option value="laptops">Laptops</option>
          <option value="smartphones">Smartphones</option>
          <option value="tablets">Tablets</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
```

---

## 📝 File 2: `src/components/ProductCard.js` তৈরি করুন

```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-image">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="no-image">📦</div>
        )}
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="category">{product.category}</p>
        <p className="price">৳{product.price.toLocaleString()}</p>
        <p className="stock">
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
        
        <button 
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="add-to-cart-btn"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
```

---

## 📝 File 3: `src/pages/CartPage.js` তৈরি করুন

```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import '../styles/CartPage.css';

function CartPage() {
  const navigate = useNavigate();
  const { cart, getTotalPrice } = useCart();

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your Cart is Empty</h2>
        <p>Add some products to get started!</p>
        <button onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      
      <div className="cart-items">
        {cart.map(item => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="cart-summary">
        <h3>Order Summary</h3>
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>৳{getTotalPrice().toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span>Shipping:</span>
          <span>৳100</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>৳{(getTotalPrice() + 100).toLocaleString()}</span>
        </div>
        
        <button 
          onClick={() => navigate('/checkout')}
          className="checkout-btn"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

export default CartPage;
```

---

## 📝 File 4: `src/pages/CheckoutPage.js` তৈরি করুন

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, processPayment } from '../services/api';
import '../styles/CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dhaka',
    paymentMethod: 'cash_on_delivery'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Create order
      const orderData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: getTotalPrice() + 100, // Including shipping
        shipping_address: `${formData.address}, ${formData.city}`,
        customer_info: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }
      };

      const order = await createOrder(orderData);

      // Process payment (simulated)
      if (formData.paymentMethod !== 'cash_on_delivery') {
        await processPayment({
          order_id: order.id,
          amount: orderData.total_amount,
          method: formData.paymentMethod
        });
      }

      // Clear cart and redirect
      clearCart();
      navigate(`/order-confirmation/${order.id}`);

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      
      <div className="checkout-container">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h2>Shipping Information</h2>
          
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <textarea
            name="address"
            placeholder="Delivery Address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            required
          />

          <select name="city" value={formData.city} onChange={handleChange}>
            <option value="Dhaka">Dhaka</option>
            <option value="Chittagong">Chittagong</option>
            <option value="Sylhet">Sylhet</option>
          </select>

          <h2>Payment Method</h2>
          
          <div className="payment-methods">
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="cash_on_delivery"
                checked={formData.paymentMethod === 'cash_on_delivery'}
                onChange={handleChange}
              />
              Cash on Delivery
            </label>

            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="bkash"
                checked={formData.paymentMethod === 'bkash'}
                onChange={handleChange}
              />
              bKash
            </label>

            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={formData.paymentMethod === 'card'}
                onChange={handleChange}
              />
              Credit/Debit Card
            </label>
          </div>

          <button type="submit" disabled={loading} className="place-order-btn">
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.map(item => (
            <div key={item.id} className="summary-item">
              <span>{item.name} x {item.quantity}</span>
              <span>৳{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <hr />
          <div className="summary-total">
            <span>Total:</span>
            <span>৳{(getTotalPrice() + 100).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
```

---

## 📝 File 5: `src/context/CartContext.js` তৈরি করুন

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('dhakacart_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dhakacart_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
```

---

# Step 2: Backend API - Products, Orders & Authentication

## 📁 Backend Folder Structure:

```bash
cd ../backend
npm init -y
```

### Folder structure:
```
backend/
├── routes/
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── authRoutes.js
│   └── paymentRoutes.js
├── controllers/
│   ├── productController.js
│   ├── orderController.js
│   ├── authController.js
│   └── paymentController.js
├── middleware/
│   ├── authMiddleware.js
│   └── roleMiddleware.js
├── models/
│   ├── User.js
│   ├── Product.js
│   └── Order.js
├── utils/
│   ├── jwtHelper.js
│   └── emailService.js
├── server.js
└── package.json
```

---

## 📝 File 1: `server.js` তৈরি করুন

```javascript
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const redis = require('redis');

// Import routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dhakacart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Redis connection
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.log('Redis Error:', err));
redisClient.connect();

// Make db and cache available to routes
app.set('db', pool);
app.set('cache', redisClient);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redisClient.ping();
    res.json({ 
      status: 'healthy',
      database: 'connected',
      cache: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

module.exports = app;
```

---

## 📝 File 2: `controllers/productController.js` তৈরি করুন

```javascript
// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    const db = req.app.get('db');
    const cache = req.app.get('cache');
    
    const cacheKey = `products:${category || 'all'}:${search || ''}`;
    
    // Try cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        source: 'cache',
        products: JSON.parse(cachedData)
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
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    // Cache for 5 minutes
    await cache.setEx(cacheKey, 300, JSON.stringify(result.rows));

    res.json({
      source: 'database',
      products: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app.get('db');

    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image } = req.body;
    const db = req.app.get('db');

    const result = await db.query(
      `INSERT INTO products (name, description, price, category, stock, image) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, category, stock, image]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, image } = req.body;
    const db = req.app.get('db');

    const result = await db.query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, category = $4, stock = $5, image = $6
       WHERE id = $7 RETURNING *`,
      [name, description, price, category, stock, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product (Admin only)
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

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

**আমি এখন বাকি files গুলো তৈরি করব। এগুলো খুবই বড় হয়ে যাচ্ছে, তাই আমি একটা Complete GitHub Repository Structure এর মতো করে সব files একসাথে দিতে পারি।**

**আপনি কি চান:**
1. ✅ **সব files এর code একসাথে একটা artifact এ** (সহজে copy করতে পারবেন)
2. ✅ **প্রতিটা Step এর জন্য Detailed Video Tutorial Style Guide**
3. ✅ **Docker Compose দিয়ে এক command এ পুরো setup run করার guide**

**কোনটা বেশি helpful হবে বলে মনে হয়?** 🚀