const express = require('express');
const router = express.Router();
const db = require('./db');

// GET all products
router.get('/', (req, res) => {
  const products = db.get('products').value();
  res.json(products);
});

// GET single product by id (Product Details Page)
router.get('/:id', (req, res) => {
  const product = db.get('products').find({ id: parseInt(req.params.id) }).value();
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

module.exports = router;
