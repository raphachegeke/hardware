const express = require("express");
const router = express.Router();
const mpesaController = require("../controllers/mpesaController");
const { verifyToken } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

router.post("/stkpush", verifyToken, mpesaController.stkPush);
router.post("/retry/:orderId", verifyToken, mpesaController.retryStkPush);
router.get("/status/:orderId", verifyToken, mpesaController.checkPaymentStatus);
router.post("/callback", mpesaController.stkCallback);

// Admin only - for verifying payments manually
router.post("/manual-confirm", verifyToken, admin, mpesaController.manualConfirm);


module.exports = router;