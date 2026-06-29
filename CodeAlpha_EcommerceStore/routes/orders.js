const express = require('express');
const router = express.Router();
const db = require('./db');

// PLACE ORDER (Order Processing)
router.post('/', (req, res) => {
  const { customerName, email, items, totalAmount } = req.body;

  if (!customerName || !email || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing order details' });
  }

  // Reduce stock for each ordered item
  items.forEach((item) => {
    const product = db.get('products').find({ id: item.id });
    const current = product.value();
    if (current) {
      const newStock = Math.max(0, current.stock - item.quantity);
      product.assign({ stock: newStock }).write();
    }
  });

  const newOrder = {
    id: Date.now(),
    customerName,
    email,
    items,
    totalAmount,
    status: 'Processing',
    createdAt: new Date().toISOString()
  };

  db.get('orders').push(newOrder).write();
  res.status(201).json({ message: 'Order placed successfully', order: newOrder });
});

// GET all orders (for testing / admin view)
router.get('/', (req, res) => {
  res.json(db.get('orders').value());
});

module.exports = router;
