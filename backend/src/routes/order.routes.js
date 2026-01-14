import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders
} from '../controllers/order.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/', protect, adminOnly, getAllOrders);

export default router;