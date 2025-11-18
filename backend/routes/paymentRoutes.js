// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.post('/bkash', authenticateToken, paymentController.processBkashPayment);
router.post('/card', authenticateToken, paymentController.processCardPayment);
router.post('/cod', authenticateToken, paymentController.processCOD);
router.get('/status/:order_id', authenticateToken, paymentController.getPaymentStatus);

// Admin routes
router.post('/refund', authenticateToken, requireAdmin, paymentController.refundPayment);
router.get('/history', authenticateToken, requireAdmin, paymentController.getPaymentHistory);

module.exports = router;