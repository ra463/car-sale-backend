const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  uploadCarDetails,
  addDescription,
  addKeyFeatures,
  getCarDetails,
} = require("../controllers/carController");

const router = express.Router();

router.route("/upload-car-details").post(auth, uploadCarDetails);
router.route("/add-description/:id").post(auth, addDescription);
router.route("/add-features/:id").post(auth, addKeyFeatures);
router.route("/get-car-details/:id").get(auth, getCarDetails);


module.exports = router;
