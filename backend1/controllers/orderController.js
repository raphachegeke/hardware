const Order = require("../models/Order");
const Product = require("../models/Product");

// Create order
// controllers/orderController.js
exports.createOrder = async (req, res) => {
  try {
    const { items, phone, deliveryAddress } = req.body;

    // Calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
      });
      totalAmount += product.price * item.quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      phone,
      deliveryAddress,
      status: "pending", // 👈 MAKE SURE THIS IS SET
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone address") // 👈 Populate user details
      .populate("items.product", "name price image") // 👈 Populate product details
      .sort({ createdAt: -1 }); // 👈 Newest first

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Also update getMyOrders so user sees item names
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name price image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};