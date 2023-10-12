const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User");

exports.createBidding = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const auction = await Auction.findById(req.params.auctionId).populate(
      "bids"
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const { bid_amount } = req.body;
    if (!bid_amount)
      return res.status(400).json({ message: "Bidding Amount is required" });

    if (auction.status === "inactive")
      return res
        .status(400)
        .json({ message: "Bid cannot be Placed. Auction is inactive" });

    const bid = await Bid.create({
      auction: auction._id,
      bidder: user._id,
      bid_amount: bid_amount,
    });

    if (auction.bids.length === 0) {
      auction.highest_bid = bid._id;
    }

    if (auction.bids.length !== 0) {
      auction.bids.forEach((bidding) => {
        if (bidding.bid_amount < bid_amount) {
          auction.highest_bid = bid._id;
        }
      });
    }

    auction.bids.unshift(bid._id);
    user.bids.unshift(bid._id);

    await auction.save();
    await user.save();

    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAuctionBids = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const auction = await Auction.findById(req.params.auctionId).populate(
      "bids"
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    res.status(200).json({
      success: true,
      bids: auction.bids,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
