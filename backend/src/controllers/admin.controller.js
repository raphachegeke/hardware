import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;

  const allowedStatuses = ['PROCESSING', 'DELIVERED', 'COMPLETED', 'FAILED'];
  if (!allowedStatuses.includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status;
  await order.save();

  res.json(order);
};

export const getAllUsers = async (req, res) => {
  const users = await User.find().select('-passwordHash');
  res.json(users);
};

export const updateProduct = async (req, res) => {
  const { productId, updates } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  Object.keys(updates).forEach(key => {
    if (key === 'variants') {
      // update stock for variants
      updates.variants.forEach(v => {
        const variant = product.variants.find(x => x.label === v.label);
        if (variant) {
          if (v.price !== undefined) variant.price = v.price;
          if (v.stock !== undefined) variant.stock = v.stock;
        } else {
          product.variants.push(v);
        }
      });
    } else {
      product[key] = updates[key];
    }
  });

  await product.save();
  res.json(product);
};