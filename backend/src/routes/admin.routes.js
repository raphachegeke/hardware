import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  updateOrderStatus,
  getAllUsers,
  updateProduct
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.put('/order-status', updateOrderStatus);
router.put('/update-product', updateProduct);

export default router;