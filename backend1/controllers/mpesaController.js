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

// Initiate STK Push (for new orders)
exports.stkPush = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Prevent re-initiating if already paid
    if (order.status === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

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
      AccountReference: order._id.toString(),
      TransactionDesc: "Hardware Shop Payment",
    };

    const { data } = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Save checkout request ID to order for tracking
    if (data.CheckoutRequestID) {
      await Order.findByIdAndUpdate(orderId, {
        checkoutRequestID: data.CheckoutRequestID,
        status: "pending", // Reset to pending for new attempt
        mpesaReceiptNumber: null,
      });
    }

    res.json(data);
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: "STK Push failed",
      details: error.response?.data?.errorMessage || error.message 
    });
  }
};

// Retry STK Push for existing order
exports.retryStkPush = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "paid") return res.status(400).json({ message: "Order already paid" });

    // Use the phone number from the original order
    const phone = order.phone;

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
      AccountReference: order._id.toString(),
      TransactionDesc: "Hardware Shop Payment",
    };

    const { data } = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Update with new checkout request ID
    if (data.CheckoutRequestID) {
      await Order.findByIdAndUpdate(orderId, {
        checkoutRequestID: data.CheckoutRequestID,
        status: "pending",
        mpesaReceiptNumber: null,
        paymentAttempts: (order.paymentAttempts || 0) + 1,
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Retry STK Push Error:", error.response?.data || error.message);
    res.status(500).json({ 
      message: "STK Push retry failed",
      details: error.response?.data?.errorMessage || error.message 
    });
  }
};

// Check payment status (polled by frontend)
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) return res.status(404).json({ message: "Order not found" });

    // If already paid, return immediately
    if (order.status === "paid") {
      return res.json({
        status: "paid",
        mpesaReceiptNumber: order.mpesaReceiptNumber,
      });
    }

    // If explicitly failed, return that
    if (order.status === "failed") {
      return res.json({
        status: "failed",
        message: "Payment was declined or cancelled",
      });
    }

    // If still pending, optionally query M-Pesa directly
    // This is useful if the callback failed to arrive
    if (order.checkoutRequestID && order.status === "pending") {
      try {
        const accessToken = await getAccessToken();
        const timestamp = new Date()
          .toISOString()
          .replace(/[-:.TZ]/g, "")
          .slice(0, 14);

        const password = Buffer.from(
          process.env.MPESA_SHORTCODE + process.env.MPESA_PASSKEY + timestamp
        ).toString("base64");

        const { data } = await axios.post(
          `${process.env.MPESA_BASE_URL}/mpesa/stkquery/v1/query`,
          {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: order.checkoutRequestID,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const resultCode = data.ResultCode;

        if (resultCode === "0") {
          // Paid - update order
          const receipt = data.CallbackMetadata?.Item?.find(
            (i) => i.Name === "MpesaReceiptNumber"
          )?.Value;

          await Order.findByIdAndUpdate(orderId, {
            status: "paid",
            mpesaReceiptNumber: receipt,
          });

          return res.json({
            status: "paid",
            mpesaReceiptNumber: receipt,
          });
        } else if (resultCode === "1032" || resultCode === "1037") {
          // 1032 = Cancelled by user, 1037 = Timeout
          await Order.findByIdAndUpdate(orderId, { status: "failed" });
          return res.json({
            status: "failed",
            message: resultCode === "1032" 
              ? "You cancelled the payment on your phone" 
              : "Payment timed out. Please try again.",
          });
        } else if (resultCode === "1036") {
          // Insufficient funds
          await Order.findByIdAndUpdate(orderId, { status: "failed" });
          return res.json({
            status: "failed",
            message: "Insufficient funds in your M-Pesa account",
          });
        }
        // For other codes (1001 = processing), continue polling
      } catch (queryError) {
        console.error("STK Query Error:", queryError.response?.data || queryError.message);
        // Don't fail the whole request, just return pending
      }
    }

    // Still pending
    res.json({ status: "pending" });
  } catch (error) {
    console.error("Check Status Error:", error.message);
    res.status(500).json({ message: "Failed to check payment status" });
  }
};

// STK Callback (called by M-Pesa servers)
exports.stkCallback = async (req, res) => {
  try {
    console.log("======= M-PESA CALLBACK RECEIVED =======");
    console.log("Time:", new Date().toISOString());
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("=========================================");

    const stkCallback = req.body?.Body?.stkCallback;
    if (!stkCallback) {
      console.log("ERROR: No stkCallback in body");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "No data" });
    }

    const orderId = stkCallback.AccountReference;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const checkoutRequestID = stkCallback.CheckoutRequestID;

    console.log(`Order: ${orderId}, ResultCode: ${resultCode}, Desc: ${resultDesc}`);

    const receipt = stkCallback.CallbackMetadata?.Item?.find(
      (i) => i.Name === "MpesaReceiptNumber"
    )?.Value;

    if (resultCode === 0) {
      const updated = await Order.findByIdAndUpdate(
        orderId,
        {
          status: "paid",
          mpesaReceiptNumber: receipt,
          checkoutRequestID: checkoutRequestID,
          paidAt: new Date(),
        },
        { new: true }
      );
      console.log(`✅ Order ${orderId} PAID. Receipt: ${receipt}`);
      console.log("Updated order:", JSON.stringify(updated, null, 2));
    } else {
      await Order.findByIdAndUpdate(orderId, {
        status: "failed",
        lastPaymentError: resultDesc,
        checkoutRequestID: checkoutRequestID,
      });
      console.log(`❌ Order ${orderId} FAILED: ${resultDesc}`);
    }

    // Always respond quickly to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("======= CALLBACK ERROR =======");
    console.error(error);
    console.error("==============================");
    res.status(500).json({ ResultCode: 1, ResultDesc: "Server error" });
  }
};

// Add this at the bottom of the file

// Manual payment confirmation (fallback when callback fails)
exports.manualConfirm = async (req, res) => {
  try {
    const { orderId, receiptNumber } = req.body;

    if (!orderId || !receiptNumber) {
      return res.status(400).json({ message: "Order ID and receipt number required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    order.status = "paid";
    order.mpesaReceiptNumber = receiptNumber;
    order.paidAt = new Date();
    await order.save();

    console.log(`Manual confirm: Order ${orderId} paid with receipt ${receiptNumber}`);

    res.json({ message: "Payment confirmed", order });
  } catch (error) {
    console.error("Manual confirm error:", error);
    res.status(500).json({ message: "Failed to confirm payment" });
  }
};

// Debug endpoint - check what M-Pesa would see
exports.debugCallback = async (req, res) => {
  console.log("=== DEBUG CALLBACK RECEIVED ===");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("=== END DEBUG ===");
  res.json({ message: "Debug logged, check server logs" });
};