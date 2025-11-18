// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { validateProduct } = require('../middleware/validationMiddleware');


// Admin Dashboard
router.get('/dashboard', authenticateToken, requireAdmin, adminController.getDashboardStats);

// Product Management
router.post('/products', authenticateToken, requireAdmin, validateProduct, adminController.createProduct);
router.put('/products/:id', authenticateToken, requireAdmin, validateProduct, adminController.updateProduct);
router.delete('/products/:id', authenticateToken, requireAdmin, adminController.deleteProduct);

// Order Management
router.get('/orders', authenticateToken, requireAdmin, adminController.getAllOrders);
router.put('/orders/:id/status', authenticateToken, requireAdmin, adminController.updateOrderStatus);

// User Management
router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);
router.put('/users/:id/role', authenticateToken, requireAdmin, adminController.updateUserRole);

// Analytics
router.get('/sales-report', authenticateToken, requireAdmin, adminController.getSalesReport);

module.exports = router;
    return response.data;
