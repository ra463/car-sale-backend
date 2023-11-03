const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Car = require("../models/Car");
const User = require("../models/User");
const generateCode = require("../utils/generateCode");
const { generateUsername } = require("../utils/generateUsername");
const resetPasswordCode = require("../utils/sendMail");

const sendData = (user, statusCode, res, message) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    user,
    token,
    message,
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, age, role, phoneNumber, address } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !age ||
      !phoneNumber ||
      !address ||
      !role
    ) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    if (phoneNumber.length < 9)
      return res
        .status(400)
        .json({ message: "Phone number must be at least 9 digit long" });
    if (phoneNumber.length > 12)
      return res
        .status(400)
        .json({ message: "Phone number must be at most 12 digit long" });

    let user = await User.findOne({ email });
    let user2 = await User.findOne({ phoneNumber });
    if (user)
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    if (user2)
      return res
        .status(400)
        .json({ message: "User with this number already exists" });

    const split = name.split(" ")[0];
    let username = await generateUsername(split);

    user = await User.create({
      name,
      email,
      password,
      username: username,
      age,
      role,
      phoneNumber,
      address,
    });

    user.password = undefined;
    sendData(user, 201, res, `${user.name} registered successfully`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordMatched = await user.matchPassword(password);
    if (!isPasswordMatched)
      return res.status(400).json({ message: "Invalid credentials" });

    user.password = undefined;
    sendData(user, 200, res, `${user.name} logged in successfully`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found:k" });

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
    const { name, email, age, phoneNumber, address } = req.body;

    let user = await User.findOne({ phoneNumber });
    if (user && user._id.toString() !== req.userId.toString()) {
      return res
        .status(400)
        .json({ message: "User with number already exists" });
    }
    let user1 = await User.findOne({ email });
    if (user1 && user1._id.toString() !== req.userId.toString()) {
      return res.status(400).json({
        message:
          "Try with different email. User with this email already exists",
      });
    }

    const newUserData = {
      name,
      email,
      age,
      phoneNumber,
      address,
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
      return res.status(400).json({ message: "Invalid OldPassword password" });

    const isPasswordMatched = await user.matchPassword(newPassword);
    if (isPasswordMatched)
      return res
        .status(400)
        .json({ message: "New password cannot be the same as old password" });
    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password Changed successfully" });
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
    resetPasswordCode(email, user.name, code);

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

    if (user.temp_code === code) {
      user.temp_code = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(200).json({ message: "Code Validated Successfully." });
    } else {
      res.status(400).json({ message: "Invalid Code" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!newPassword || !confirmPassword)
      return res.status(400).json({ message: "Please fill in all fields" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

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
      .populate("bidder", "name email")
      .populate({
        path: "auction",
        select: "car highest_bid auction_start auction_end",
        populate: {
          path: "highest_bid",
          model: "Bid",
          select: "bid_amount",
        },
        populate: {
          path: "car",
          model: "Car",
          select:
            "model manufacture_company color fuel_type transmission_type images",
        },
      })
      .sort({ createdAt: -1 });

    if (!bids) return res.status(404).json({ message: "Bids not found" });

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
        "model manufacture_company unique_identification_number fuel_type description odometer_reading drive_type images"
      )
      .populate("highest_bid", "bid_amount");

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

exports.getAllUserCars = async (req, res) => {
  try {
    const cars = await Car.find({ seller: req.userId });
    if (!cars) return res.status(404).json({ message: "Cars not found" });

    res.status(200).json({ success: true, cars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
