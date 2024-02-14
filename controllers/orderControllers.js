const axios = require("axios");
const Order = require("../models/Order");
const Auction = require("../models/Auction");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const generateAccessToken = require("../utils/paypal");
const Bid = require("../models/Bid");
const catchAsyncError = require("../utils/catchAsyncError");
const {
  paymentDone,
  confirmationPaymentEmail,
  refundEmail,
} = require("../utils/sendMail");

const base = "https://api-m.sandbox.paypal.com";

exports.createAuctionOrder = catchAsyncError(async (req, res, next) => {
  const url = `${base}/v2/checkout/orders`;

  const { auctionId } = req.body;
  if (!auctionId)
    return res
      .status(400)
      .json({ success: false, message: "Auction id is required" });
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    return res
      .status(400)
      .json({ success: false, message: "Auction not found" });
  }

  if (auction.status === "sold" || auction.status === "refunded") {
    return res.status(400).json({
      success: false,
      message: "Auction is already sold/refunded",
    });
  }

  let price = 0;
  if (auction.seller.toString() === req.userId.toString()) {
    price = auction.highest_bid * 0.1;
  } else {
    price = 100;
  }
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
});

exports.captureAuctionOrder = catchAsyncError(async (req, res, next) => {
  const { auctionId } = req.body;
  if (!auctionId)
    return res
      .status(400)
      .json({ success: false, message: "Auction id is required" });
  const auction = await Auction.findById(auctionId);

  let price = 0;
  if (auction.seller.toString() === req.userId.toString()) {
    price = auction.highest_bid * 0.1;
  } else {
    price = 100;
  }

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
    status: "PENDING",
  });
  const newOrder = await order.save();

  const transaction = new Transaction({
    order: newOrder._id,
    user: req.userId,
    amount: price,
    transactionId: data.purchase_units[0].payments.captures[0].id,
    status: "PENDING",
  });
  await transaction.save();

  await transaction.populate("user", "firstname email");

  await confirmationPaymentEmail(
    transaction.user.email,
    transaction.user.firstname,
    auction._id,
    price
  );

  res.status(200).json({
    success: true,
    paymentCaptured: data.purchase_units[0].payments.captures[0],
  });
});

exports.createRefund = catchAsyncError(async (req, res, next) => {
  const { auctionId } = req.body;
  if (!auctionId)
    return res
      .status(400)
      .json({ success: false, message: "Auction id is required" });

  const auction = await Auction.findById(auctionId);
  if (!auction)
    return res
      .status(400)
      .json({ success: false, message: "Auction not found" });

  const order = await Order.findOne({ auction: auction._id });
  if (!order)
    return res.status(400).json({ success: false, message: "Order not found" });

  const transaction = await Transaction.findOne({ order: order._id });
  if (!transaction)
    return res
      .status(400)
      .json({ success: false, message: "Transaction not found" });

  if (
    auction.is_Seller_paid10_percent === true &&
    auction.is_Winner_paid10_percent === true
  ) {
    return res.status(400).json({
      success: false,
      message:
        "You cannot perform Refund Action in this auction as both the user's have paid the amount",
    });
  }

  if (
    auction.is_Seller_paid10_percent === false &&
    auction.is_Winner_paid10_percent === false
  ) {
    return res.status(400).json({
      success: false,
      message:
        "You cannot perform Refund Action in this auction as both the user's hasn't paid the amount",
    });
  }

  const accessToken = await generateAccessToken();
  const url = `${base}/v2/payments/captures/${transaction.transactionId}/refund`;
  const { data } = await axios.post(
    url,
    {
      amount: {
        value: transaction.amount.toFixed(2),
        currency_code: "AUD",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  res.status(200).json({
    success: true,
    data: data,
    message: "Refund Initiated Successfully",
  });
});

exports.createAuctionWebhook = catchAsyncError(async (req, res, next) => {
  if (req.body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = req.body.resource.supplementary_data.related_ids.order_id;

    const order = await Order.findOne({ paypalOrderId: orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const transaction = await Transaction.findOne({
      order: order._id,
    }).populate("user", "firstname email");
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

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

    if (
      auction.is_Seller_paid10_percent === true &&
      auction.is_Winner_paid10_percent === true
    ) {
      auction.status = "sold";
      await auction.save();
    }

    await paymentDone(
      transaction.user.email,
      transaction.user.firstname,
      auction._id,
      transaction.transactionId,
      transaction.amount
    );
  } else if (req.body.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    // Refunding webhook
    let transactionId = null;
    req.body.resource.links.forEach((link) => {
      if (link.rel === "up") {
        transactionId = link.href.split("/")[6];
      }
    });

    const transaction = await Transaction.findOne({
      transactionId: transactionId,
    }).populate("order", "paypalOrderId");
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }

    const order = await Order.findOne({
      paypalOrderId: transaction.order.paypalOrderId,
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const auction = await Auction.findById(order.auction);
    if (!auction) {
      return res
        .status(404)
        .json({ success: false, message: "Auction not found" });
    }

    if (
      auction.is_Seller_paid10_percent === false &&
      auction.is_Winner_paid10_percent === true
    ) {
      // console.log("entered-1");
      const bids = await Bid.find({ auction: auction._id }).sort({
        createdAt: -1,
      });
      const bid = bids[0];
      const winner = await User.findById(bid.bidder);
      const seller = await User.findById(auction.seller);
      seller.is_locked = true;
      auction.is_Winner_paid10_percent = false;
      auction.status = "refunded";
      await seller.save();
      await auction.save();
      // console.log(user.email, user.name, auction._id, transaction.amount);
      await refundEmail(
        winner.email,
        winner.firstname,
        auction._id,
        transaction.amount
      );
    } else if (
      auction.is_Seller_paid10_percent === true &&
      auction.is_Winner_paid10_percent === false
    ) {
      // console.log("entered-2");
      const bids = await Bid.find({ auction: auction._id }).sort({
        createdAt: -1,
      });
      const bid = bids[0];
      const winner = await User.findById(bid.bidder);
      const seller = await User.findById(auction.seller);
      winner.is_locked = true;
      auction.is_Seller_paid10_percent = false;
      auction.status = "refunded";
      await winner.save();
      await auction.save();
      // console.log(user.email, user.name, auction._id, transaction.amount);
      await refundEmail(
        seller.email,
        seller.firstname,
        auction._id,
        transaction.amount
      );
    }

    transaction.status = "REFUNDED";
    order.status = "REFUNDED";
    await transaction.save();
    await order.save();
  }

  res.status(200).json({ success: true, message: "Webhook closes working" });
});
