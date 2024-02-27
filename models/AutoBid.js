const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    autobid_active: {
      type: Boolean,
      default: false,
    },
    max_amount: {
      type: Number,
      required: [true, "Max amount is required"],
    },
    increment: {
      type: Number,
      required: [true, "Increment amount is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AutoBid", schema);
