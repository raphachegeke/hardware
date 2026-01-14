import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantLabel: String,
    price: Number,
    quantity: Number
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    subtotal: Number,
    deliveryInfo: {
      phone: String,
      location: String,
      notes: String
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);