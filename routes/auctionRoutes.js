const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  getAuctionDetails,
  getAllAuctions,
  createAuction,
  confirmBid,
  testingDateTime,
} = require("../controllers/auctionControllers");

const router = express.Router();

router.route("/create-auction/:carId").post(auth, createAuction);
router.route("/get-all-auctions").get(getAllAuctions);
router.route("/get-auction-details/:auctionId").get(getAuctionDetails);
router.route("/confirm-bid/:auctionId").post(auth, confirmBid);
router.route("/test").post(testingDateTime);

module.exports = router;
