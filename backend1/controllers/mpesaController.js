const axios = require("axios");
const Order = require("../models/Order");

// Generate access token
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const { data } = await axios.get(
    `${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );
  return data.access_token;
};

// Initiate STK Push
exports.stkPush = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const accessToken = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: order.totalAmount,
      PartyA: phone,
      PartyB: 6444134,
      PhoneNumber: phone,
      CallBackURL: `${process.env.BACKEND_URL}/api/mpesa/callback`,
      AccountReference: order._id,
      TransactionDesc: "Hardware Shop Payment",
    };

    const { data } = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json(data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "STK Push failed" });
  }
};

// STK Callback
exports.stkCallback = async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;

    const orderId = callbackData.AccountReference;
    const resultCode = callbackData.ResultCode;
    const receipt = callbackData.CallbackMetadata?.Item?.find(
      (i) => i.Name === "MpesaReceiptNumber"
    )?.Value;

    if (resultCode === 0) {
      // Success
      await Order.findByIdAndUpdate(orderId, {
        status: "paid",
        mpesaReceiptNumber: receipt,
      });
    } else {
      await Order.findByIdAndUpdate(orderId, { status: "failed" });
    }

    res.json({ message: "Callback received" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Callback error" });
  }
};