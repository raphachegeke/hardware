import express from 'express';
import { getCart, addToCart, updateCartItem } from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update', protect, updateCartItem);

export default router;