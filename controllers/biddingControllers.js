const Auction = require("../models/Auction");
const AutoBid = require("../models/AutoBid");
const Bid = require("../models/Bid");
const User = require("../models/User");
const catchAsyncError = require("../utils/catchAsyncError");

exports.createBidding = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const auction = await Auction.findById(req.params.auctionId);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  const autoBids = await AutoBid.findOne({
    user: user._id,
    auction: auction._id,
  });

  if (autoBids) {
    if (autoBids.autobid_active === true)
      return res.status(400).json({
        message: "AutoBid is active. You can't place another bid",
      });
  }

  const bids = await Bid.find({ auction: auction._id });

  if (auction.status === "inactive" || auction.status === "closed")
    return res.status(400).json({
      message: "Bid cannot be Placed. Auction is Inactive/Closed",
    });

  if (auction.auction_confirmed === true)
    return res.status(400).json({
      message: "Auction is already confirmed. You can't Place Bid Anymore",
    });

  if (auction.seller.toString() === user._id.toString())
    return res.status(400).json({
      message: "You cannot place bid on your own auction",
    });

  const { bid_amount } = req.body;

  if (bid_amount % 50 !== 0) {
    return res.status(400).json({
      message: "Bidding Amount should be increment of 50 dollars",
    });
  }

  if (bid_amount <= 0) {
    return res.status(400).json({
      message:
        "Bid Amount should be greater than 0. Please enter a valid amount",
    });
  }

  if (bids.length === 0) {
    if (bid_amount) {
      await Bid.create({
        auction: auction._id,
        bidder: user._id,
        bid_amount: bid_amount,
      });

      auction.highest_bid = bid_amount;
      if (bid_amount >= auction.asking_price * 0.9) {
        auction.reserve_flag = "90% Reserve Met";
      }
      if (bid_amount >= auction.asking_price) {
        auction.reserve_flag = "Reserve Met";
      }
      await auction.save();

      res.status(201).json({
        success: true,
        message: `Bid Placed Successfully`,
      });
    }
  }

  if (bids.length !== 0) {
    if (bid_amount < auction.highest_bid) {
      return res.status(400).json({
        success: false,
        message:
          "Bidding Amount should be greater than the current highest bid",
      });
    }

    let bidPlaced = false;
    // check that bid amount should be always 50 dollar more than the current highest bid
    const diff = bid_amount - auction.highest_bid;
    if (diff < 49) {
      return res.status(400).json({
        success: false,
        message:
          "Bid Amount should be atleast 50 dollar more than the current highest bid",
      });
    }

    await Bid.create({
      auction: auction._id,
      bidder: user._id,
      bid_amount: bid_amount,
    });

    auction.highest_bid = bid_amount;
    if (bid_amount >= auction.asking_price * 0.9) {
      auction.reserve_flag = "90% Reserve Met";
    }
    if (bid_amount >= auction.asking_price) {
      auction.reserve_flag = "Reserve Met";
    }
    await auction.save();
    bidPlaced = true;

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
});

exports.getAuctionBids = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const auction = await Auction.findById(req.params.auctionId);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  if (auction.seller.toString() !== user._id.toString())
    return res.status(400).json({
      message: "You cannot view bids on this auction",
    });

  const bids = await Bid.find({ auction: auction._id }).sort({
    createdAt: -1,
  });

  if (
    auction.is_Seller_paid10_percent === true &&
    auction.is_Winner_paid10_percent === true
  ) {
    await bids[0].populate(
      "bidder",
      "firstname middlename lastname email phone"
    );
  }

  res.status(200).json({
    success: true,
    bids,
  });
});
