const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "pending",
    },

    phone: {
      type: String,
      required: true,
    },

    deliveryAddress: {
      type: String,
      required: true,
    },

    mpesaReceiptNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);