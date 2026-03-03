const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { stkPush, stkCallback } = require("../controllers/mpesaController");

router.post("/stkpush", protect, stkPush);
router.post("/callback", stkCallback); // Called by Safaricom

module.exports = router;