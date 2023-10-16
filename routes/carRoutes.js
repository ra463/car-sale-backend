const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  uploadCarDetails,
  addKeyFeatures,
  getCarDetails,
  uploadMoreCarImages,
  deleteCarImage,
  deleteCar,
} = require("../controllers/carController");
const { upload } = require("../utils/s3");

const router = express.Router();

router
  .route("/upload-car-details")
  .post(upload.array("images"), auth, uploadCarDetails);
router.route("/add-features/:carId").post(auth, addKeyFeatures);
router
  .route("/upload-more-car-images/:carId")
  .put(upload.array("image"), auth, uploadMoreCarImages);
router.route("/get-car-details/:carId").get(auth, getCarDetails);
router.route("/delete-car-image/:carId").delete(auth, deleteCarImage);
router.route("/delete-car/:carId").delete(auth, deleteCar);

module.exports = router;
