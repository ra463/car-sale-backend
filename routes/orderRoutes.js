const express = require("express");
const { auth } = require("../middlewares/auth");
const { createAuctionOrder } = require("../controllers/orderControllers");

const router = express.Router();

router.post("/create-auction-order", auth, createAuctionOrder);
// router.post("/capture-payment/:orderId", auth, captureOrderPayment);
// router.post("/webhook", bookingWebhook);

module.exports = router;