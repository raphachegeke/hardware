import Category from '../models/Category.js';

export const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
};

export const getCategories = async (req, res) => {
  res.json(await Category.find({ isActive: true }));
};