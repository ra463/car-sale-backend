const Auction = require("../models/Auction");
const User = require("../models/User");
const catchAsyncError = require("../utils/catchAsyncError");
const AutoBid = require("../models/AutoBid");
const Bid = require("../models/Bid");

exports.turnOnAutoBid = catchAsyncError(async (req, res, next) => {
  const { max_amount, increment_amount } = req.body;

  const [auction, user] = await Promise.all([
    await Auction.findById(req.params.auctionId),
    await User.findById(req.userId),
  ]);

  if (!auction) return res.status(404).json({ message: "Auction not found" });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (auction.status === "inactive" || auction.status === "closed")
    return res.status(400).json({
      message: "Bid cannot be Placed. Auction is Inactive/Closed",
    });

  if (auction.auction_confirmed === true)
    return res.status(400).json({
      message:
        "Auction is already confirmed. You can't turn on AutoBid Anymore",
    });

  if (auction.seller.toString() === user._id.toString())
    return res.status(400).json({
      message: "You cannot turn on autobid on your own auction",
    });

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
    if (max_amount < increment_amount || max_amount < auction.highest_bid)
      return res.status(400).json({
        success: false,
        message:
          "The max amount must be greater than the increment amount and the current highest bid",
      });

    if (max_amount - auction.highest_bid < increment_amount) {
      return res.status(400).json({
        success: false,
        message:
          "The increment amount must be less than the difference between the max amount and the highest bid",
      });
    }
    await AutoBid.create({
      auction: auction._id,
      user: user._id,
      autobid_active: true,
      max_amount,
      increment_amount,
    });

    await Bid.create({
      auction: auction._id,
      user: user._id,
      bid_amount: auction.highest_bid + increment_amount,
    });

    return res.status(200).json({ success: true, message: "AutoBid Enabled" });
  }
});

exports.getAutoBidOfUserInAuction = catchAsyncError(async (req, res, next) => {
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

  res.status(200).json({ success: true, auto_bid });
});

exports.autoBid = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findById(req.params.auctionId);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  if (auction.status === "inactive" || auction.status === "closed") return;
  if (auction.auction_confirmed === true) return;

  const all_bids = await Bid.find({ auction: auction._id });

  let bidIncremented = false;
  do {
    bidIncremented = false;

    const autoBidsUser = await AutoBid.find({
      auction: auction._id,
      autobid_active: true,
      max_amount: { $gt: auction.highest_bid },
    });

    if (autoBidsUser.length === 0) break;

    const autoBidsUserArray = [];
    for (let i = 0; i < autoBidsUser.length; i++) {
      if (
        autoBidsUser[i].max_amount - auction.highest_bid >
        autoBidsUser[i].increment_amount
      ) {
        autoBidsUserArray.push(autoBidsUser[i]);
      }
    }

    if (autoBidsUserArray.length === 0) {
      bidIncremented = false;
      break;
    }

    for (let i = 0; i < autoBidsUserArray.length; i++) {
      if (autoBidsUserArray[i].max_amount > auction.highest_bid) {
        if (
          autoBidsUserArray[i].max_amount - auction.highest_bid >
          autoBidsUserArray[i].increment_amount
        ) {
          if (
            all_bids[all_bids.length - 1].bidder.toString() ===
            autoBidsUserArray[i].user.toString()
          ) {
            bidIncremented = false;
            break;
          }
          const bid = await Bid.create({
            auction: auction._id,
            user: autoBidsUserArray[i].user,
            bid_amount:
              auction.highest_bid + autoBidsUserArray[i].increment_amount,
            tag: "via AutoBid",
          });

          auction.highest_bid = bid.bid_amount;
          if (bid.bid_amount >= auction.asking_price * 0.9) {
            auction.reserve_flag = "90% Reserve Met";
          }
          if (bid.bid_amount >= auction.asking_price) {
            auction.reserve_flag = "Reserve Met";
          }
          await auction.save();
          bidIncremented = true;
        }
      }
    }
  } while (bidIncremented);

  return res.status(200).json({ success: true, message: "AutoBid Done" });
});

exports.test = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findById(req.params.auctionId);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  const autoBidsUser = await Bid.find({
    auction: auction._id,
  }).sort({
    createdAt: -1,
  });

  const array1 = [];
  for (let i = 0; i < autoBidsUser.length; i++) {
    array1.push(autoBidsUser[i]);
  }

  const lastBid = autoBidsUser[autoBidsUser.length - 1];

  return res.status(200).json({ success: true, array1, lastBid });
});
