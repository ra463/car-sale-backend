const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    auction_id: {
      type: String,
      required: [true, "Auction ID is required"],
      trim: true,
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    auction_start: {
      type: Date,
      required: [true, "Auction start date is required"],
    },
    auction_end: {
      type: Date,
      required: [true, "Auction end date is required"],
    },
    asking_price: {
      type: Number,
      required: [true, "Asking Price is required"],
      maxLength: [7, "Asking price must be less than 7 digits"],
      trim: true,
    },
    show_hide_price: {
      type: Boolean,
      default: false,
    },
    reserve_flag: {
      type: String,
      default: "Reserve Not Met",
    },
    highest_bid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "closed", "refunded", "sold"],
      default: "inactive",
    },
    seller_type: {
      type: String,
      required: [true, "Seller type is required"],
      enum: ["private", "company"],
      default: "private",
    },
    company_name: {
      type: String,
    },
    abn: {
      type: String,
    },
    is_Seller_paid10_percent: {
      type: Boolean,
      default: false,
    },
    is_Winner_paid10_percent: {
      type: Boolean,
      default: false,
    },
    auction_confirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auction", schema);
