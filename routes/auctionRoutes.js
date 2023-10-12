const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createAuction,
  getAuctionDetails,
  getAllAuctions,
} = require("../controllers/auctionControllers");

const router = express.Router();

router.route("/create-auction/:carId").post(auth, createAuction);
router.route("/get-auction-details/:auctionId").get(auth, getAuctionDetails);
router.route("/get-all-auctions").get(auth, getAllAuctions);

module.exports = router;
