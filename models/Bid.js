const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bid_amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      maxLength: [7, "Bid amount must be less than 7 digits"],
      trim: true,
    },
    tag: {
      type: String,
    },
    is_confirmed_bid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", schema);
