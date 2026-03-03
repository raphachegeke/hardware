const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

const {
  createOrder,
  getMyOrders,
  getAllOrders,
} = require("../controllers/orderController");

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/", protect, admin, getAllOrders);

module.exports = router;