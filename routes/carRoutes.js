const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  uploadCarDetails,
  addKeyFeatures,
  getCarDetails,
  uploadMoreCarImages,
  deleteCarImage,
  deleteCar,
  getCarImages,
  editCarDetails,
  getAllCars,
} = require("../controllers/carController");
const { upload } = require("../utils/s3");

const router = express.Router();

router
  .route("/upload-car-details")
  .post(upload.array("image"), auth, uploadCarDetails);
router.route("/add-features/:carId").post(auth, addKeyFeatures);
router
  .route("/add-more-car-images/:carId")
  .put(upload.array("image"), auth, uploadMoreCarImages);
router.route("/get-car-details/:carId").get(getCarDetails);
router.route("/delete-car-image/:carId").delete(auth, deleteCarImage);
router.route("/delete-car/:carId").delete(auth, deleteCar);
router.route("/get-car-images/:carId").get(getCarImages);
router.route("/edit-car-details/:carId").put(auth, editCarDetails);
router.route("/get-all-cars").get(auth, getAllCars);

module.exports = router;
