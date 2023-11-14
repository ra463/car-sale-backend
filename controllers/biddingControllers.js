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

    if (auction.auction_confirmed === true)
      return res.status(400).json({
        message: "Auction is already confirmed. You can't Place Bid Anymore",
      });

    if (auction.seller.toString() === user._id.toString())
      return res.status(400).json({
        message: "You cannot place bid on your own auction",
      });

    const { bid_amount } = req.body;
    if (!bid_amount || bid_amount === 0)
      return res.status(400).json({ message: "Bidding Amount is required" });

    if (auction.status === "inactive" || auction.status === "closed")
      return res.status(400).json({
        message: "Bid cannot be Placed. Auction is Inactive/Closed",
      });

    if (auction.bids.length === 0) {
      if (bid_amount) {
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
          message: `Bid Placed Successfully`,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: `Bid Amount should be greater than the minimum threshold amount of ${auction.min_threshold}`,
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
          message: "Bid Amount should be greater than the current highest bid",
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

    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    if (auction.seller.toString() !== user._id.toString())
      return res.status(400).json({
        message: "You cannot view bids on this auction",
      });

    if (
      auction.is_Seller_paid10_percent === true &&
      auction.is_Winner_paid10_percent === true
    ) {
      await auction.populate({
        path: "highest_bid",
        populate: {
          path: "bidder",
          model: "User",
          select: "name email phoneNumber",
        },
      });
    }

    res.status(200).json({
      success: true,
      bids: auction.bids,
      highest_bid: auction.highest_bid,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
