const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Car = require("../models/Car");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { newUser, resetPasswordCode } = require("../utils/sendMail");
const { generateClientId } = require("../utils/generateClientId");
const generateCode = require("../utils/generateCode");
const generateDrivingToken = require("../utils/drivingLicense");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config({
  path: "../config/config.env",
});

const sendData = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  res.status(statusCode).json({
    user,
    token,
    message,
  });
};

exports.generateToken = async (req, res) => {
  try {
    // const url = "https://api.oneclickservices.com.au/api/v1/token";
    // const headers = {
    //   Accept: "application/json",
    //   "Client-Secret": `${process.env.CLIENT_DRIVING_SECRET}`,
    //   Authorization: `Bearer ${process.env.APP_DRIVING_KEY}`,
    // };

    // const response = await axios.post(url, null, { headers });

    // res
    //   .status(200)
    //   .json({ message: true, data: response.data, token: response.data.token });

    const data = await generateDrivingToken();
    res.status(200).json({ message: true, data: data });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error,
      cred: process.env.APP_DRIVING_KEY,
      cred1: process.env.CLIENT_DRIVING_SECRET,
    });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const {
      firstname,
      middlename,
      lastname,
      dob,
      licence_state,
      licencenumber,
      cardnumberback,
      email,
      password,
      age,
      phoneNumber,
      address,
      city,
      state,
      postal_code,
      shuburb,
    } = req.body;

    const user_exist = await User.findOne({
      $or: [{ email: { $regex: new RegExp(email, "i") } }, { phoneNumber }],
    });

    if (user_exist) {
      return next(
        new ErrorHandler(
          `${user_exist.email ? "Email" : "Mobile"} already exists`,
          400
        )
      );
    }

    const access_token = await generateDrivingToken();

    const url = "https://api.oneclickservices.com.au/api/v1/dvs";
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Client-Secret": `${process.env.CLIENT_DRIVING_SECRET}`,
      Authorization: `Bearer ${access_token}`,
    };

    const data = {
      document: "driverslicence",
      fields: {
        firstname: firstname,
        middlename: middlename ? middlename : "",
        lastname: lastname,
        dob: dob,
        state: licence_state,
        licencenumber: licencenumber,
        cardnumberback: cardnumberback,
      },
    };

    const response = await axios.post(url, data, { headers });

    if (response.data.status === "error") {
      return res
        .status(400)
        .json({ message: response.data.message, error: response.data.errors });
    }

    let client = generateClientId();
    let user = await User.create({
      firstname,
      middlename,
      lastname,
      dob,
      card_details: {
        licence_state,
        licencenumber,
        cardnumberback,
      },
      email: email.toLowerCase(),
      password,
      clientId: client,
      age,
      phoneNumber,
      address,
      city,
      state,
      postal_code,
      shuburb,
    });

    user.password = undefined;
    await newUser(email, firstname);
    sendData(
      user,
      201,
      res,
      `Welcome Sir!! Your License has been verified Successfully`
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorField = Object.keys(error.errors)[0];
      const errorMessage = error.errors[firstErrorField].message;
      return res.status(400).json({ message: errorMessage });
    }
    res.status(400).json({ message: error });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (user.is_locked === true)
      return res
        .status(400)
        .json({ message: "Your account is locked. Please contact admin" });

    const isPasswordMatched = await user.matchPassword(password);
    if (!isPasswordMatched)
      return res.status(400).json({ message: "Invalid credentials" });

    user.password = undefined;
    sendData(user, 200, res, `${user.firstname} logged in successfully`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      firstname,
      middlename,
      lastname,
      dob,
      email,
      age,
      phoneNumber,
      address,
      city,
      state,
      postal_code,
      shuburb,
    } = req.body;

    if (email) {
      email = email.toLowerCase();
    }

    let user = await User.findOne({
      $or: [{ phoneNumber }, { email }],
    });

    if (user && user._id.toString() !== req.userId) {
      return res
        .status(400)
        .json({ message: "User already exists with this phone/email" });
    }

    const newUserData = {
      firstname,
      middlename,
      lastname,
      dob,
      email,
      age,
      phoneNumber,
      address,
      city,
      state,
      postal_code,
      shuburb,
    };

    await User.findByIdAndUpdate(req.userId, newUserData, {
      new: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorField = Object.keys(error.errors)[0];
      const errorMessage = error.errors[firstErrorField].message;
      return res.status(400).json({ message: errorMessage });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findById(req.userId).select("+password");
    const isMatched = await user.matchPassword(oldPassword);
    if (!isMatched)
      return res.status(400).json({ message: "Invalid Old Password" });

    const isPasswordMatched = await user.matchPassword(newPassword);
    if (isPasswordMatched)
      return res
        .status(400)
        .json({ message: "New password cannot be the same as old password" });

    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });

    user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password Changed Successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.sendForgotPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = generateCode(6);

    await User.findOneAndUpdate({ email }, { temp_code: code });
    await resetPasswordCode(email, user.firstname, code);

    res.status(200).json({ message: "Code sent to your email." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.validateCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ message: "Code is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.temp_code !== code)
      return res.status(400).json({ message: "Invalid/Expired Code" });

    user.temp_code = null;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Code validated successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword)
      return res.status(400).json({ message: "Please fill in all fields" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (newPassword.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be atleast 8 characters" });

    user.password = newPassword;
    await user.save();

    res.status(203).json({ message: "Password Updated Successfully." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllUserBids = async (req, res) => {
  try {
    const bids = await Bid.find({
      bidder: req.userId,
    })
      .populate({
        path: "auction",
        select:
          "car highest_bid auction_start auction_end status is_Seller_paid10_percent is_Winner_paid10_percent seller",
        populate: [
          {
            path: "car",
            model: "Car",
            select:
              "model manufacture_company color fuel_type transmission_type images unique_identification_number",
          },
          // {
          //   path: "highest_bid",
          //   model: "Bid",
          //   select: "bid_amount",
          // },
        ],
      })
      .sort({ createdAt: -1 });

    if (!bids) return res.status(404).json({ message: "Bids not found" });

    for (const bid of bids) {
      if (
        bid.auction &&
        bid.auction.is_Seller_paid10_percent === true &&
        bid.auction.is_Winner_paid10_percent === true
      ) {
        await bid.auction.populate(
          "seller",
          "firstname middlename lastname email phoneNumber"
        );
      }
    }

    res.status(200).json({
      success: true,
      bids,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllUserAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.userId })
      .populate(
        "car",
        "model manufacture_company unique_identification_number fuel_type description odometer_reading drive_type images vehicle_type"
      )
      .sort({ createdAt: -1 });

    if (!auctions)
      return res.status(404).json({ message: "Auctions not found" });

    res.status(200).json({
      success: true,
      auctions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserAuctionDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const auction = await Auction.findById(req.params.auctionId)
      .populate("car")
      .populate("seller", "firstname middlename lastname");

    if (user._id.toString() !== auction.seller._id.toString()) {
      return res
        .status(400)
        .json({ message: "You are not authorized to view this auction" });
    }
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    const bids = await Bid.find({ auction: req.params.auctionId })
      .sort({
        createdAt: -1,
      })
      .select("bid_amount bidder");

    if (
      auction.is_Seller_paid10_percent === true &&
      auction.is_Winner_paid10_percent === true
    ) {
      await bids[0].populate(
        "bidder",
        "firstname middlename lastname email phoneNumber"
      );
    }

    res.status(200).json({ success: true, auction, bids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUserAuction = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.seller.toString() !== req.userId.toString())
      return res
        .status(400)
        .json({ message: "You are not authorized to delete this auction" });

    const car = await Car.findById(auction.car);
    if (!car) return res.status(404).json({ message: "Car not found" });

    car.isAuction_created = false;
    await car.save();

    const bids = await Bid.find({ auction: auction._id });
    bids.forEach(async (bid) => {
      await bid.deleteOne();
    });
    await auction.deleteOne();

    res.status(200).json({
      success: true,
      message: "Auction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUserCars = async (req, res) => {
  try {
    const cars = await Car.find({ seller: req.userId }).sort({ createdAt: -1 });
    if (!cars) return res.status(404).json({ message: "Cars not found" });

    res.status(200).json({ success: true, cars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSellerWonAuction = async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.userId })
      .sort({
        createdAt: -1,
      })
      .populate("car", "unique_identification_number images");
    if (!auctions)
      return res
        .status(404)
        .json({ message: "You haven't created any auction yet" });

    const wonAuctions = auctions.filter((auction) => auction.status === "sold");
    res.status(200).json({ success: true, wonAuctions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBuyerWonAuction = async (req, res) => {
  try {
    const bids = await Bid.find({
      bidder: req.userId,
      is_confirmed_bid: true,
    })
      .populate("auction")
      .populate({
        path: "auction",
        populate: {
          path: "car",
          model: "Car",
          select:
            "unique_identification_number model car_address car_city car_state car_shuburb car_postal_code is_Seller_paid10_percent is_Winner_paid10_percent",
        },
      })
      .sort({ createdAt: -1 });

    // const wonBuyerAuctions = bids.filter(
    //   (bid) => bid.auction.status === "sold"
    // );

    // populate seller when is_Winner_paid10_percent is_seller_paid10_percent are true
    const processedBids = await Promise.all(
      bids.map(async (bid) => {
        if (
          bid.auction &&
          bid.auction.is_Seller_paid10_percent === true &&
          bid.auction.is_Winner_paid10_percent === true
        ) {
          await bid.populate(
            "auction.seller",
            "firstname middlename lastname email phoneNumber"
          );
        }
        return bid;
      })
    );

    res.status(200).json({ success: true, wonBuyerAuctions: processedBids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.userId })
      .populate("user", "firstname middlename lastname email")
      .populate("order")
      .populate({
        path: "order",
        select: "auction",
        populate: {
          path: "auction",
          model: "Auction",
          select:
            "car auction_start auction_end status is_Seller_paid10_percent is_Winner_paid10_percent",
          populate: {
            path: "car",
            model: "Car",
            select: "model unique_identification_number",
          },
        },
      });

    if (!transactions)
      return res.status(404).json({ message: "Transactions not found" });

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
