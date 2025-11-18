// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateOrder } = require('../middleware/validationMiddleware');

router.post('/', authenticateToken, validateOrder, orderController.createOrder);
router.get('/', authenticateToken, orderController.getUserOrders);
router.get('/stats', authenticateToken, orderController.getOrderStats);
router.get('/:id', authenticateToken, orderController.getOrderById);
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);

module.exports = router;