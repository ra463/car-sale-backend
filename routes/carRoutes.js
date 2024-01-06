const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  uploadCarDetails,
  addKeyFeatures,
  getCarDetails,
  uploadCarImages,
  deleteCarImage,
  deleteCar,
  getCarImages,
  editCarDetails,
  getAllCars,
  getAllUniqueCarNames,
  pushCarImagesIntoArray,
  removeUplodedCarImages,
} = require("../controllers/carController");
const { upload } = require("../utils/s3");

const router = express.Router();

router.route("/upload-car-details").post(auth, uploadCarDetails);
router.route("/add-features/:carId").post(auth, addKeyFeatures);
router
  .route("/add-car-images")
  .post(upload.array("image"), auth, uploadCarImages);
router.delete("/remove-car-image", auth, removeUplodedCarImages);
router.route("/push-more-images/:carId").patch(auth, pushCarImagesIntoArray);
router.route("/delete-car-image/:carId").delete(auth, deleteCarImage);
router.route("/get-car-details/:carId").get(auth, getCarDetails);
router.route("/delete-car/:carId").delete(auth, deleteCar);
router.route("/get-car-images/:carId").get(getCarImages);
router.route("/edit-car-details/:carId").put(auth, editCarDetails);
router.route("/get-all-cars").get(auth, getAllCars);
router.route("/get-all-unique-car-names").get(getAllUniqueCarNames);

module.exports = router;
