import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. Small, Large
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    images: [String],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    variants: [variantSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);