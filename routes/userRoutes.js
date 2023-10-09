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

module.exports = router;
