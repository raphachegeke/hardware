import express from 'express';
import { createProduct, getProducts } from '../controllers/product.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, adminOnly, createProduct);
router.get('/', getProducts);

export default router;