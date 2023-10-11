const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createBidding,
  getAuctionBids,
} = require("../controllers/biddingControllers");

const router = express.Router();

router.route("/create-bidding/:auctionId").post(auth, createBidding);
router.route("/get-auction-bids/:auctionId").get(auth, getAuctionBids);

module.exports = router;
