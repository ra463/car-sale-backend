const express = require("express");
const {
  adminLogin,
  getAllUsers,
  getAllCars,
  getUser,
  getCarById,
} = require("../controllers/adminControllers");
const { isAdmin, auth } = require("../middlewares/auth");

const router = express.Router();

router.route("/login").post(adminLogin);
router.route("/getallusers").get(auth, isAdmin, getAllUsers);
router.route("/getuser/:id").get(auth, isAdmin, getUser);
router.route("/getallcars").get(auth, isAdmin, getAllCars);
router.route("/getcar/:id").get(auth, isAdmin, getCarById);

module.exports = router;
