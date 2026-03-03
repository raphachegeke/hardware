const Order = require("../models/Order");
const Product = require("../models/Product");

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { items, phone, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    let totalAmount = 0;

    // Calculate total and reduce stock
    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      totalAmount += product.price * item.quantity;

      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      phone,
      deliveryAddress,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get logged in user orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate("items.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user").populate("items.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};