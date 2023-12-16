const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createAuctionOrder,
  captureAuctionOrder,
  createAuctionWebhook,
} = require("../controllers/orderControllers");

const router = express.Router();

router.post("/create-auction-order", auth, createAuctionOrder);
router.post("/capture-payment/:orderId", auth, captureAuctionOrder);
router.put("/auction-webhook", createAuctionWebhook);

module.exports = router;
