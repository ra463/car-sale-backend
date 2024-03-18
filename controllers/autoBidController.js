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
      success: false,
      message: "Bid cannot be Placed. Auction is Inactive/Closed",
    });

  if (auction.auction_confirmed === true)
    return res.status(400).json({
      success: false,
      message:
        "Auction is already confirmed. You can't turn on AutoBid Anymore",
    });

  if (auction.seller.toString() === user._id.toString())
    return res.status(400).json({
      success: false,
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
    if (
      max_amount < increment_amount ||
      max_amount < auction.highest_bid ||
      max_amount % 50 !== 0
    )
      return res.status(400).json({
        success: false,
        message:
          "The max amount must be multiple of 50 & greater than the increment amount & the current highest bid",
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

    const bid = await Bid.create({
      auction: auction._id,
      bidder: user._id,
      bid_amount:
        auction.highest_bid === 0 || null
          ? increment_amount
          : auction.highest_bid + increment_amount,
    });

    auction.highest_bid = bid.bid_amount;
    await auction.save();
    const reserve_flag = auction.reserve_flag;

    return res.status(200).json({
      success: true,
      message: "Bid Created & AutoBid Enabled",
      bid,
      reserve_flag,
    });
  }
});

exports.updateAutoBidDetails = catchAsyncError(async (req, res, next) => {
  const { max_amount, increment_amount } = req.body;

  const [auction, user] = await Promise.all([
    await Auction.findById(req.params.auctionId),
    await User.findById(req.userId),
  ]);

  if (!auction)
    return res
      .status(404)
      .json({ success: false, message: "Auction not found" });
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  if (auction.status === "inactive" || auction.status === "closed")
    return res.status(400).json({
      success: false,
      message: "Bid cannot be Placed. Auction is Inactive/Closed",
    });

  if (auction.auction_confirmed === true)
    return res.status(400).json({
      success: false,
      message:
        "Auction is already confirmed. You can't turn on AutoBid Anymore",
    });

  if (auction.seller.toString() === user._id.toString())
    return res.status(400).json({
      success: false,
      message: "You cannot turn on autobid on your own auction",
    });

  const auto_bid = await AutoBid.findOne({
    auction: auction._id,
    user: user._id,
  });

  if (!auto_bid)
    return res
      .status(404)
      .json({ success: false, message: "AutoBid not found" });

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

  auto_bid.max_amount = max_amount;
  auto_bid.increment_amount = increment_amount;
  auto_bid.autobid_active = true;

  await auto_bid.save();

  const bid = await Bid.create({
    auction: auction._id,
    bidder: user._id,
    bid_amount: auction.highest_bid + increment_amount,
  });

  auction.highest_bid = bid.bid_amount;
  await auction.save();
  const reserve_flag = auction.reserve_flag;

  return res.status(200).json({
    success: true,
    message: "Bid Created & AutoBid Updated",
    bid,
    reserve_flag,
  });
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

  return res.status(200).json({ success: true, auto_bid });
});

exports.autoBid = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findById(req.params.auctionId);
  if (!auction) return res.status(404).json({ message: "Auction not found" });

  if (auction.status === "inactive" || auction.status === "closed")
    return res.status(400).json({ message: "Auction is Inactive/Closed" });
  if (auction.auction_confirmed === true)
    return res.status(400).json({ message: "Auction is already confirmed" });

  let all_bids = await Bid.find({ auction: auction._id });

  let bidIncremented = false;
  do {
    bidIncremented = false;

    const autoBidsUser = await AutoBid.find({
      auction: auction._id,
      autobid_active: true,
      max_amount: { $gt: auction.highest_bid },
    });

    if (autoBidsUser.length === 0) {
      bidIncremented = false;
      break;
    }

    const autoBidsUserArray = [];
    for (let i = 0; i < autoBidsUser.length; i++) {
      if (
        autoBidsUser[i].max_amount - auction.highest_bid >=
        autoBidsUser[i].increment_amount
      ) {
        autoBidsUserArray.push(autoBidsUser[i]);
      } else {
        autoBidsUser[i].autobid_active = false;
      }
    }

    if (autoBidsUserArray.length === 0) {
      bidIncremented = false;
      break;
    }

    for (let i = 0; i < autoBidsUserArray.length; i++) {
      if (autoBidsUserArray[i].max_amount > auction.highest_bid) {
        if (
          autoBidsUserArray[i].max_amount - auction.highest_bid >=
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
            bidder: autoBidsUserArray[i].user,
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

          all_bids = await Bid.find({ auction: auction._id });
        }
      }
    }
  } while (bidIncremented);

  // --------------------------------- running loop in for resverse -------------

  let bidReverseIncremented = true;
  do {
    bidReverseIncremented = false;

    const autoBidsUser = await AutoBid.find({
      auction: auction._id,
      autobid_active: true,
      max_amount: { $gt: auction.highest_bid },
    });

    if (autoBidsUser.length === 0) {
      bidReverseIncremented = false;
      break;
    }

    let autoBidsUserArray = [];
    for (let i = 0; i < autoBidsUser.length; i++) {
      if (
        autoBidsUser[i].max_amount - auction.highest_bid >=
        autoBidsUser[i].increment_amount
      ) {
        autoBidsUserArray.push(autoBidsUser[i]);
      } else {
        autoBidsUser[i].autobid_active = false;
      }
    }

    if (autoBidsUserArray.length === 0) {
      bidReverseIncremented = false;
      break;
    }

    autoBidsUserArray = autoBidsUserArray.reverse();

    for (let i = 0; i < autoBidsUserArray.length; i++) {
      if (autoBidsUserArray[i].max_amount > auction.highest_bid) {
        if (
          autoBidsUserArray[i].max_amount - auction.highest_bid >=
          autoBidsUserArray[i].increment_amount
        ) {
          if (
            all_bids[all_bids.length - 1].bidder.toString() ===
            autoBidsUserArray[i].user.toString()
          ) {
            console.log(all_bids[all_bids.length - 1].bidder.toString());
            bidReverseIncremented = false;
            break;
          }
          const bid = await Bid.create({
            auction: auction._id,
            bidder: autoBidsUserArray[i].user,
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
          bidReverseIncremented = true;

          all_bids = await Bid.find({ auction: auction._id });
        }
      }
    }
  } while (bidReverseIncremented);

  let bid = all_bids[all_bids.length - 1];
  const reserve_flag = auction.reserve_flag;

  return res
    .status(200)
    .json({ success: true, message: "AutoBid Done", bid, reserve_flag });
});

exports.test = catchAsyncError(async (req, res, next) => {
  const bids = await Bid.find({
    bidder: "65d4563e12fdf96d9db94a5a",
  });

  for (let i = 0; i < bids.length; i++) {
    await bids[i].deleteOne();
  }

  return res.status(200).json({ success: true });
});
