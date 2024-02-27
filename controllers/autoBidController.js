const Auction = require("../models/Auction");
const User = require("../models/User");
const catchAsyncError = require("../utils/catchAsyncError");
const AutoBid = require("../models/AutoBid");

exports.turnOnAutoBid = catchAsyncError(async (req, res, next) => {
  const { max_amount, increment } = req.body;
  const [auction, user] = await Promise.all([
    await Auction.findById(req.params.auctionId),
    await User.findById(req.userId),
  ]);

  if (!auction) return res.status(404).json({ message: "Auction not found" });
  if (!user) return res.status(404).json({ message: "User not found" });

  const auto_bid = await AutoBid.findOne({
    auction: auction._id,
    user: user._id,
  });

  if (auto_bid) {
    if (auto_bid.autobid_active === true) {
      auto_bid.autobid_active = false;
      await auto_bid.save();

      return res
        .status(200)
        .json({ success: true, message: "AutoBid Disabled" });
    } else {
      auto_bid.autobid_active = true;
      await auto_bid.save();

      return res
        .status(200)
        .json({ success: true, message: "AutoBid Enabled" });
    }
  } else {
    await AutoBid.create({
      auction: auction._id,
      user: user._id,
      autobid_active: true,
      max_amount,
      increment,
    });

    return res.status(200).json({ success: true, message: "AutoBid Enabled" });
  }
});
