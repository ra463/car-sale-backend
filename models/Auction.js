const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    auction_start_date: {
      type: Date,
      required: [true, "Auction start date is required"],
      trim: true,
    },
    auction_end_date: {
      type: Date,
      required: [true, "Auction end date is required"],
      trim: true,
    },
    starting_bid: {
      type: Number,
      required: [true, "Starting bid is required"],
      trim: true,
    },
    highest_bid: {
      type: Number,
      trim: true,
      ref: "Bid",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    bids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bid",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", schema);
