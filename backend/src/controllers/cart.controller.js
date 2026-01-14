import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  res.json(cart || { items: [] });
};

export const addToCart = async (req, res) => {
  const { productId, variantLabel, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const variant = product.variants.find(v => v.label === variantLabel);
  if (!variant) return res.status(400).json({ message: 'Invalid variant' });

  if (quantity > variant.stock)
    return res.status(400).json({ message: 'Insufficient stock' });

  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

  const item = cart.items.find(
    i => i.product.toString() === productId && i.variantLabel === variantLabel
  );

  if (item) {
    item.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      variantLabel,
      price: variant.price,
      quantity
    });
  }

  await cart.save();
  res.json(cart);
};

export const updateCartItem = async (req, res) => {
  const { productId, variantLabel, quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart empty' });

  const item = cart.items.find(
    i => i.product.toString() === productId && i.variantLabel === variantLabel
  );
  if (!item) return res.status(404).json({ message: 'Item not found' });

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i !== item);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  res.json(cart);
};