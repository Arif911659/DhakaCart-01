// backend/controllers/paymentController.js

// Simulate bKash Payment
exports.processBkashPayment = async (req, res) => {
  try {
    const { order_id, amount, phone } = req.body;
    const db = req.app.get('db');

    // Validate
    if (!order_id || !amount || !phone) {
      return res.status(400).json({ error: 'Order ID, amount, and phone required' });
    }

    // Get order
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.total_amount !== parseFloat(amount)) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Simulate payment processing (2 second delay)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Random success/failure for simulation
    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again.'
      });
    }

    // Create payment record
    const transactionId = `BKS${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const paymentResult = await db.query(
      `INSERT INTO payments (order_id, amount, payment_method, transaction_id, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [order_id, amount, 'bkash', transactionId, 'completed']
    );

    // Update order payment status
    await db.query(
      `UPDATE orders 
       SET payment_status = 'paid', 
           status = 'processing',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [order_id]
    );

    res.json({
      success: true,
      message: 'Payment successful',
      payment: paymentResult.rows[0],
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('bKash payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
};

// Simulate Card Payment
exports.processCardPayment = async (req, res) => {
  try {
    const { order_id, amount, card_number, card_holder, expiry, cvv } = req.body;
    const db = req.app.get('db');

    // Validate
    if (!order_id || !amount || !card_number || !card_holder || !expiry || !cvv) {
      return res.status(400).json({ error: 'All card details required' });
    }

    // Basic card validation
    if (card_number.length < 16) {
      return res.status(400).json({ error: 'Invalid card number' });
    }

    if (cvv.length < 3) {
      return res.status(400).json({ error: 'Invalid CVV' });
    }

    // Get order
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.total_amount !== parseFloat(amount)) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Random success/failure
    const isSuccess = Math.random() > 0.15; // 85% success rate

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Card payment declined. Please check your card details.'
      });
    }

    // Create payment record
    const transactionId = `CARD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const paymentResult = await db.query(
      `INSERT INTO payments (order_id, amount, payment_method, transaction_id, status, card_last4) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [order_id, amount, 'card', transactionId, 'completed', card_number.slice(-4)]
    );

    // Update order
    await db.query(
      `UPDATE orders 
       SET payment_status = 'paid', 
           status = 'processing',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [order_id]
    );

    res.json({
      success: true,
      message: 'Payment successful',
      payment: paymentResult.rows[0],
      transaction_id: transactionId
    });

  } catch (error) {
    console.error('Card payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
};

// Process Cash on Delivery
exports.processCOD = async (req, res) => {
  try {
    const { order_id } = req.body;
    const db = req.app.get('db');

    // Get order
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Create payment record
    const paymentResult = await db.query(
      `INSERT INTO payments (order_id, amount, payment_method, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [order_id, order.total_amount, 'cash_on_delivery', 'pending']
    );

    // Update order status
    await db.query(
      `UPDATE orders 
       SET payment_status = 'pending', 
           status = 'processing',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [order_id]
    );

    res.json({
      success: true,
      message: 'Order placed successfully. Pay when you receive the product.',
      payment: paymentResult.rows[0]
    });

  } catch (error) {
    console.error('COD processing error:', error);
    res.status(500).json({ error: 'Failed to process cash on delivery' });
  }
};

// Get Payment Status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const db = req.app.get('db');

    const result = await db.query(
      `SELECT p.*, o.total_amount, o.status as order_status 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.order_id = $1 AND o.user_id = $2`,
      [order_id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ payment: result.rows[0] });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};

// Refund Payment (Admin only)
exports.refundPayment = async (req, res) => {
  try {
    const { payment_id, reason } = req.body;
    const db = req.app.get('db');

    // Get payment
    const paymentResult = await db.query(
      'SELECT * FROM payments WHERE id = $1',
      [payment_id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status === 'refunded') {
      return res.status(400).json({ error: 'Payment already refunded' });
    }

    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update payment status
    await db.query(
      `UPDATE payments 
       SET status = 'refunded', 
           refund_reason = $1,
           refund_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [reason, payment_id]
    );

    // Update order status
    await db.query(
      `UPDATE orders 
       SET payment_status = 'refunded', 
           status = 'cancelled',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [payment.order_id]
    );

    res.json({
      success: true,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
};

// Get Payment History (Admin)
exports.getPaymentHistory = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;
    const db = req.app.get('db');

    let query = `
      SELECT p.*, o.user_id, u.name as customer_name, u.email as customer_email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    if (method) {
      params.push(method);
      query += ` AND p.payment_method = $${params.length}`;
    }

    query += ' ORDER BY p.created_at DESC';

    // Pagination
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({ payments: result.rows });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
};