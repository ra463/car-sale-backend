const express = require("express");
const {
  adminLogin,
  getAllUsers,
  getAllCars,
  getUser,
  getCarById,
  updateUser,
  deleteUser,
  updateCar,
  deleteCar,
  getAllAdminsAuctions,
  getAdminAuctionById,
  deleteAuction,
  getAllBids,
  getBidById,
  deleteBid,
} = require("../controllers/adminControllers");
const { isAdmin, auth } = require("../middlewares/auth");

const router = express.Router();

router.route("/login").post(adminLogin);
router.route("/getallusers").get(auth, isAdmin, getAllUsers);
router.route("/getuser/:id").get(auth, isAdmin, getUser);
router.route("/updateuser/:id").put(auth, isAdmin, updateUser);
router.route("/deleteuser/:id").delete(auth, isAdmin, deleteUser);

router.route("/getallcars").get(auth, isAdmin, getAllCars);
router.route("/getcar/:id").get(auth, isAdmin, getCarById);
router.route("/updatecar/:id").put(auth, isAdmin, updateCar);
router.route("/deletecar/:id").delete(auth, isAdmin, deleteCar);

router.route("/getalauctions").get(auth, isAdmin, getAllAdminsAuctions);
router.route("/getauction/:id").get(auth, isAdmin, getAdminAuctionById);
router.route("/deleteauction/:id").delete(auth, isAdmin, deleteAuction);

router.route("/getallbids").get(auth, isAdmin, getAllBids);
router.route("/getbid/:id").get(auth, isAdmin, getBidById);
router.route("/deletebid/:id").delete(auth, isAdmin, deleteBid);

module.exports = router;
