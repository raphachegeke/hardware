import Product from '../models/Product.js';

export const createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

export const getProducts = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name');
  res.json(products);
};