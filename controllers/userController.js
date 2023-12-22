const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Car = require("../models/Car");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { newUser, resetPasswordCode } = require("../utils/sendMail");
const { generateClientId } = require("../utils/generateClientId");
const generateCode = require("../utils/generateCode");

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
    const {
      name,
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

    if (
      !name ||
      !email ||
      !password ||
      !age ||
      !phoneNumber ||
      !address ||
      !city ||
      !state ||
      !postal_code
    ) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    if (phoneNumber.length < 9)
      return res
        .status(400)
        .json({ message: "Phone number must be at least 9 digit long" });
    if (phoneNumber.length > 11)
      return res
        .status(400)
        .json({ message: "Phone number must be at most 11 digit long" });
    if (age < 18) {
      return res
        .status(400)
        .json({ message: "You must be 18 or above to register" });
    }
    if (postal_code && isNaN(postal_code)) {
      return res.status(400).json({ message: "Postal code must be a number" });
    }

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

    let client = await generateClientId();

    user = await User.create({
      name,
      email,
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
    await newUser(email, name);
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
    if (user.is_locked === true)
      return res
        .status(400)
        .json({ message: "Your account is locked. Please contact admin" });

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
      name,
      email,
      age,
      phoneNumber,
      address,
      city,
      state,
      postal_code,
      shuburb,
    } = req.body;

    if (phoneNumber.length < 9)
      return res
        .status(400)
        .json({ message: "Phone number should be at least 9 digit long" });
    if (phoneNumber.length > 11)
      return res
        .status(400)
        .json({ message: "Phone number should be at most 11 digit long" });
    if (age < 18) {
      return res.status(400).json({ message: "Your age must be above 18" });
    }
    if (postal_code && isNaN(postal_code)) {
      return res.status(400).json({ message: "Postal code must be a number" });
    }

    let user = await User.findOne({ phoneNumber });
    if (user && user._id.toString() !== req.userId.toString()) {
      return res
        .status(400)
        .json({ message: "User with this phone number already exists" });
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
    await resetPasswordCode(email, user.name, code);

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
        await bid.auction.populate("seller", "name email phoneNumber");
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
      .populate("seller", "name");

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
      await bids[0].populate("bidder", "name email phoneNumber");
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

exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.userId })
      .populate("user", "name email")
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
