const axios = require("axios");
const Car = require("../models/Car");
const Auction = require("../models/Auction");
const generateAccessToken = require("../utils/paypal");

const base = "https://api.sandbox.paypal.com";

exports.createAuctionOrder = async (req, res) => {
  try {
    const url = `${base}/v2/checkout/orders`;

    const { carId } = req.body;
    const auction = await Auction.findOne({ car: carId }).populate(
      "car highest_bid seller"
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const price = auction.highest_bid.bid_amount;
    const accessToken = await generateAccessToken();

    // want the payment in australian dollar
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
    res.status(500).json({ message: error.message });
  }
};
