const Product = require("../models/Product");

// Create product (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, images, category, featured } =
      req.body;

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      images,
      category,
      featured,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};