const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    phone: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "delivered"],
      default: "pending",
    },
    mpesaReceiptNumber: String,
    checkoutRequestID: String,
    lastPaymentError: String,
    paymentAttempts: { type: Number, default: 0 },
    paidAt: Date,
  },
  { timestamps: true }
);

// const orderSchema = mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     items: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         quantity: {
//           type: Number,
//           required: true,
//         },
//       },
//     ],

//     totalAmount: {
//       type: Number,
//       required: true,
//     },

//     status: {
//       type: String,
//       default: "pending",
//     },

//     phone: {
//       type: String,
//       required: true,
//     },

//     deliveryAddress: {
//       type: String,
//       required: true,
//     },

//     mpesaReceiptNumber: String,
//   },
//   { timestamps: true }
// );

module.exports = mongoose.model("Order", orderSchema);
