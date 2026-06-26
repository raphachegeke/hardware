const express = require("express");
const router = express.Router();
const mpesaController = require("../controllers/mpesaController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/stkpush", verifyToken, mpesaController.stkPush);
router.post("/retry/:orderId", verifyToken, mpesaController.retryStkPush);
router.get("/status/:orderId", verifyToken, mpesaController.checkPaymentStatus);
router.post("/callback", mpesaController.stkCallback);
router.post("/manual-confirm", verifyToken, mpesaController.manualConfirm);
router.post("/debug-callback", mpesaController.debugCallback); // No auth

module.exports = router;