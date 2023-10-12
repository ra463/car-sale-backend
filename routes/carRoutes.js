const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  uploadCarDetails,
  addKeyFeatures,
  getCarDetails,
  uploadCarImages,
} = require("../controllers/carController");
const { upload } = require("../utils/s3");

const router = express.Router();

router.route("/upload-car-details").post(auth, uploadCarDetails);
router.route("/add-features/:carId").post(auth, addKeyFeatures);
router
  .route("/upload-car-images/:carId")
  .post(upload.array("image"), auth, uploadCarImages);
router.route("/get-car-details/:carId").get(auth, getCarDetails);

module.exports = router;
