import express from 'express';
import { protect } from '../middleware/auth.js';
import { initiateDarajaPayment, darajaCallback } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/daraja', protect, initiateDarajaPayment);
router.post('/daraja-callback', darajaCallback); // no auth, called by Safaricom

export default router;