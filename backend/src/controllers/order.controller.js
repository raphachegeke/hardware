import Cart from '../models/Cart.js';
import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  const { phone, location, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ message: 'Cart is empty' });

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order = await Order.create({
    user: req.user.id,
    items: cart.items,
    subtotal,
    deliveryInfo: { phone, location, notes }
  });

  cart.items = [];
  await cart.save();

  res.status(201).json(order);
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
  res.json(orders);
};

export const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt');
  res.json(orders);
};