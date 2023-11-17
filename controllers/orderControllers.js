const axios = require("axios");
const Order = require("../models/Order");
const Auction = require("../models/Auction");
const Transaction = require("../models/Transaction");
const generateAccessToken = require("../utils/paypal");

const base = "https://api-m.sandbox.paypal.com";

exports.createAuctionOrder = async (req, res) => {
  try {
    const url = `${base}/v2/checkout/orders`;

    const { auctionId } = req.body;
    if (!auctionId)
      return res
        .status(400)
        .json({ success: false, message: "Auction id is required" });
    const auction = await Auction.findById(auctionId);
    const price = auction.current_price * 0.1;
    const accessToken = await generateAccessToken();

    const { data } = await axios.post(
      url,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "AUD",
              value: price.toFixed(2),
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.status(201).json({ success: true, order: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.captureAuctionOrder = async (req, res) => {
  try {
    const { auctionId } = req.body;
    if (!auctionId)
      return res
        .status(400)
        .json({ success: false, message: "Auction id is required" });
    const auction = await Auction.findById(auctionId);
    const price = auction.current_price * 0.1;

    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${req.params.orderId}/capture`;

    const { data } = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const order = new Order({
      user: req.userId,
      auction: auctionId,
      amount: price,
      paypalOrderId: data.id,
      status: data.purchase_units[0].payments.captures[0].status,
    });

    const newOrder = await order.save();

    const transaction = new Transaction({
      order: newOrder._id,
      user: req.userId,
      amount: price,
      transactionId: data.purchase_units[0].payments.captures[0].id,
      status: data.purchase_units[0].payments.captures[0].status,
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      paymentCaptured: data.purchase_units[0].payments.captures[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAuctionWebhook = async (req, res) => {
  console.log("webhook working...");
  console.log("webhook payload:", req.body);
  if (req.body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    console.log("webhook payload:", req.body);
    const orderId = req.body.resource.supplementary_data.related_ids.order_id;
    console.log("webhook working...", orderId);
    const order = await Order.findOne({ paypalOrderId: orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log("order status:", req.body.resource.status);
    console.log("order payload:", order);

    const transaction = await Transaction.findOne({ order: order._id });
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }
    console.log("order status:", req.body.resource.status);
    order.status = req.body.resource.status;
    await order.save();

    transaction.status = req.body.resource.status;
    await transaction.save();

    const auction = await Auction.findById(order.auction);
    if (auction.seller.toString() === order.user.toString()) {
      auction.is_Seller_paid10_percent = true;
      await auction.save();
    } else {
      auction.is_Winner_paid10_percent = true;
      await auction.save();
    }
  }

  res.status(200).json({ success: true, message: "Webhook closes working" });
};
