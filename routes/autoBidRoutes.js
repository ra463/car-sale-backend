const express = require("express");
const {
  turnOnAutoBid,
  autoBid,
  test,
  getAutoBidOfUserInAuction,
} = require("../controllers/autoBidController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.route("/on-off-autobid/:auctionId").post(auth, turnOnAutoBid);
router.route("get-auto-bid/:auctionId").get(auth, getAutoBidOfUserInAuction);
router.route("/bid/:auctionId").get(auth, autoBid);
router.route("/test/:auctionId").get(test);

module.exports = router;
