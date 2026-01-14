import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    method: { type: String, enum: ['DARJA', 'PAYSTACK'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING'
    },
    reference: String,
    amount: Number,
    meta: Object // store any raw webhook data
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);