import axios from 'axios';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { stkPush } from '../config/daraja.js';
import { initializePayment } from '../config/paystack.js';

export const initiateDarajaPayment = async (req, res) => {
  const { orderId, phone } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const payment = await Payment.create({
    order: orderId,
    method: 'DARJA',
    amount: order.subtotal,
    status: 'PENDING'
  });

  const response = await stkPush({ phone, amount: order.subtotal, accountRef: payment._id });

  res.json({ paymentId: payment._id, stkResponse: response });
};

// Daraja webhook endpoint
export const darajaCallback = async (req, res) => {
  const data = req.body;

  const ref = data.Body.stkCallback.CheckoutRequestID;
  const payment = await Payment.findById(ref).populate('order');

  if (!payment) return res.status(404).send();

  if (data.Body.stkCallback.ResultCode === 0) {
    payment.status = 'SUCCESS';

    // Reduce stock
    for (const item of payment.order.items) {
      await Product.updateOne(
        { _id: item.product, 'variants.label': item.variantLabel },
        { $inc: { 'variants.$.stock': -item.quantity } }
      );
    }

    payment.order.status = 'PAID';
    await payment.order.save();
  } else {
    payment.status = 'FAILED';
  }

  payment.meta = data;
  await payment.save();

  res.status(200).send();
};

export const initiatePaystackPayment = async (req, res) => {
  const { orderId, email } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const payment = await Payment.create({
    order: orderId,
    method: 'PAYSTACK',
    amount: order.subtotal,
    status: 'PENDING'
  });

  const result = await initializePayment({
    email,
    amount: order.subtotal,
    reference: payment._id.toString()
  });

  res.json({ paymentId: payment._id, paymentLink: result.data.authorization_url });
};

// Paystack webhook
export const paystackWebhook = async (req, res) => {
  const event = req.body;
  const paymentRef = event.data.reference;
  const payment = await Payment.findById(paymentRef).populate('order');

  if (!payment) return res.status(404).send();

  if (event.event === 'charge.success' && event.data.status === 'success') {
    payment.status = 'SUCCESS';

    // Reduce stock
    for (const item of payment.order.items) {
      await Product.updateOne(
        { _id: item.product, 'variants.label': item.variantLabel },
        { $inc: { 'variants.$.stock': -item.quantity } }
      );
    }

    payment.order.status = 'PAID';
    await payment.order.save();
  } else {
    payment.status = 'FAILED';
  }

  payment.meta = event;
  await payment.save();

  res.status(200).send();
};