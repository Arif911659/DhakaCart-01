// backend/middleware/validationMiddleware.js

exports.validateProduct = (req, res, next) => {
  const { name, price, category, stock } = req.body;
  const errors = [];

  if (name && name.length < 3) {
    errors.push('Product name must be at least 3 characters');
  }

  if (price && (isNaN(price) || price < 0)) {
    errors.push('Price must be a positive number');
  }

  if (stock && (isNaN(stock) || stock < 0)) {
    errors.push('Stock must be a positive number');
  }

  if (category && !['laptops', 'smartphones', 'tablets', 'accessories'].includes(category)) {
    errors.push('Invalid category');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

exports.validateOrder = (req, res, next) => {
  const { items, shipping_address } = req.body;
  const errors = [];

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  if (items) {
    items.forEach((item, index) => {
      if (!item.product_id || !item.quantity) {
        errors.push(`Item ${index + 1}: product_id and quantity required`);
      }
      if (item.quantity < 1) {
        errors.push(`Item ${index + 1}: quantity must be at least 1`);
      }
    });
  }

  if (!shipping_address || shipping_address.trim().length < 10) {
    errors.push('Shipping address must be at least 10 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

