const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  uploadCarDetails,
  addKeyFeatures,
  getCarDetails,
  getUserAllCars,
} = require("../controllers/carController");

const router = express.Router();

router.route("/upload-car-details").post(auth, uploadCarDetails);
router.route("/add-features/:id").post(auth, addKeyFeatures);
router.route("/get-car-details/:id").get(auth, getCarDetails);
router.route("/get-user-cars").get(auth, getUserAllCars);

module.exports = router;
