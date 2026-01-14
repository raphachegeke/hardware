import express from 'express';
import { protect } from '../middleware/auth.js';
import { initiateDarajaPayment, darajaCallback } from '../controllers/payment.controller.js';
import { initiatePaystackPayment, paystackWebhook } from '../controllers/payment.controller.js';

// Add to router

const router = express.Router();

router.post('/daraja', protect, initiateDarajaPayment);
router.post('/daraja-callback', darajaCallback); // no auth, called by Safaricom

router.post('/paystack', protect, initiatePaystackPayment);
router.post('/paystack-webhook', paystackWebhook); // no auth, called by Paystack

export default router;