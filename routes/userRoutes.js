const express = require("express");
const {
  registerUser,
  loginUser,
  myProfile,
} = require("../controllers/userController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/myprofile").get(auth, myProfile);

module.exports = router;
