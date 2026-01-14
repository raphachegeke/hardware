import express from 'express';
import { createCategory, getCategories } from '../controllers/category.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, adminOnly, createCategory);
router.get('/', getCategories);

export default router;