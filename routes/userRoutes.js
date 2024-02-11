const express = require("express");
const {
  registerUser,
  loginUser,
  myProfile,
  updateProfile,
  updatePassword,
  sendForgotPasswordCode,
  validateCode,
  resetPassword,
  getAllUserBids,
  getAllUserAuctions,
  getAllUserCars,
  deleteUserAuction,
  getUserTransactions,
  getUserAuctionDetails,
  getSellerWonAuction,
  getBuyerWonAuction,
  // generteToken,
} = require("../controllers/userController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/myprofile").get(auth, myProfile);
router.route("/update-profile").put(auth, updateProfile);
router.route("/update-password").put(auth, updatePassword);
router.route("/send-forgot-password-code").post(sendForgotPasswordCode);
router.route("/validate-code").post(validateCode);
router.route("/reset-password").put(resetPassword);
router.route("/get-all-bids").get(auth, getAllUserBids);
router.route("/get-all-user-auctions").get(auth, getAllUserAuctions);
router
  .route("/get-user-auction-details/:auctionId")
  .get(auth, getUserAuctionDetails);
router.route("/get-seller-won-auctions").get(auth, getSellerWonAuction);
router.route("/get-buyer-won-auctions").get(auth, getBuyerWonAuction);
router.route("/get-all-user-cars").get(auth, getAllUserCars);
router.route("/delete-user-auction/:id").delete(auth, deleteUserAuction);
router.route("/get-transactions").get(auth, getUserTransactions);
// router.route("/token").get(generteToken);

module.exports = router;
