const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User");

exports.createBidding = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const auction = await Auction.findById(req.params.auctionId).populate(
      "highest_bid"
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.seller.toString() === user._id.toString())
      return res.status(400).json({
        message: "Bid cannot be Placed. You are the Seller of this Auction",
      });

    const { bid_amount } = req.body;
    if (!bid_amount)
      return res.status(400).json({ message: "Bidding Amount is required" });

    if (auction.status === "inactive" || auction.status === "closed")
      return res.status(400).json({
        message: "Bid cannot be Placed. Auction is Inactive/Closed",
      });

    if (auction.bids.length === 0) {
      if (bid_amount > auction.current_price) {
        const bid = await Bid.create({
          auction: auction._id,
          bidder: user._id,
          bid_amount: bid_amount,
        });

        auction.highest_bid = bid._id;
        auction.bids.unshift(bid._id);
        await auction.save();

        res.status(201).json({
          success: true,
          message: "Bid Placed Successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Bid cannot be Placed. Bid Amount is less than Asking Price",
        });
      }
    }

    if (auction.bids.length !== 0) {
      let bidPlaced = false;
      if (bid_amount > auction.highest_bid.bid_amount) {
        const bid = await Bid.create({
          auction: auction._id,
          bidder: user._id,
          bid_amount: bid_amount,
        });

        auction.highest_bid = bid._id;
        auction.bids.unshift(bid._id);
        await auction.save();

        bidPlaced = true;
      }

      if (bidPlaced === true) {
        return res.status(201).json({
          success: true,
          message: "Bid Placed Successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Bid cannot be Placed. Bid Amount is less than Current Highest bid",
        });
      }
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAuctionBids = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const auction = await Auction.findById(req.params.auctionId)
      .populate("bids")
      .populate({
        path: "bids",
        populate: {
          path: "bidder",
          model: "User",
          select: "name email",
        },
      });
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    res.status(200).json({
      success: true,
      bids: auction.bids,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
