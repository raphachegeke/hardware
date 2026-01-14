import axios from 'axios';

export const paystackHeaders = {
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json'
};

export const initializePayment = async ({ email, amount, reference }) => {
  const res = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email,
      amount: amount * 100, // Paystack expects kobo
      reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL
    },
    { headers: paystackHeaders }
  );

  return res.data;
};