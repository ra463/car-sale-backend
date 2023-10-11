const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  createAuction,
  getAuctionDetails,
  getAllAuctions,
} = require("../controllers/auctionControllers");

const router = express.Router();

router.route("/create-auction/:id").post(auth, createAuction);
router.route("/get-auction-details/:id").get(auth, getAuctionDetails);
router.route("/get-all-auctions").get(auth, getAllAuctions);

module.exports = router;