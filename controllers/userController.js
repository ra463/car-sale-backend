const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Car = require("../models/Car");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { newUser, resetPasswordCode } = require("../utils/sendMail");
const catchAsyncError = require("../utils/catchAsyncError");
const { generateClientId } = require("../utils/generateClientId");
const generateCode = require("../utils/generateCode");
const generateDrivingToken = require("../utils/drivingLicense");
const dotenv = require("dotenv");
const axios = require("axios");
// const { sendOTP, verifyOTP } = require("../utils/sendOtp");
dotenv.config({ path: "../config/config.env" });

const sendData = (user, statusCode, res, message) => {
  const token = user.getJWTToken();
  return res.status(statusCode).json({
    user,
    token,
    message,
  });
};

exports.registerUser = catchAsyncError(async (req, res, next) => {
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
    phone,
    address,
    city,
    state,
    postal_code,
    shuburb,
    document,
    passportnumber,
  } = req.body;

  const user_exist = await User.findOne({
    $or: [{ email: { $regex: new RegExp(email, "i") } }, { phone }],
  });

  if (user_exist) {
    return res
      .status(400)
      .json({ message: "User already exists with this email/phone" });
  }

  const access_token = await generateDrivingToken();
  const url = "https://api.oneclickservices.com.au/api/v1/dvs";
  let client = generateClientId();

  if (document === "driverslicence") {
    if (!licence_state || !licencenumber || !cardnumberback) {
      return res.status(400).json({
        success: false,
        message: "All driving licence fields are required",
      });
    }
    const data = {
      document: document,
      fields: {
        firstname: firstname,
        middlename: middlename,
        lastname: lastname,
        dob: dob,
        state: licence_state,
        licencenumber: licencenumber,
        cardnumberback: cardnumberback,
      },
    };
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Client-Secret": `${process.env.CLIENT_DRIVING_SECRET}`,
      Authorization: `Bearer ${access_token}`,
    };

    const repo = await axios.post(url, data, { headers });
    if (repo.status == 200 && repo.data.result == "N") {
      return res
        .status(200)
        .json({ success: false, message: repo.data.errors });
    }

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
      phone,
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
      `Welcome Sir!! Your Document has been verified Successfully`
    );
  } else if (document === "passport") {
    const data = {
      document: document,
      fields: {
        firstname: firstname,
        middlename: middlename,
        lastname: lastname,
        dob: dob,
        passportnumber: passportnumber,
      },
    };
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Client-Secret": `${process.env.CLIENT_DRIVING_SECRET}`,
      Authorization: `Bearer ${access_token}`,
    };

    const repo = await axios.post(url, data, { headers });
    if (repo.status == 200 && repo.data.result == "N") {
      return res
        .status(200)
        .json({ success: false, message: repo.data.errors });
    }

    let user = await User.create({
      firstname,
      middlename,
      lastname,
      dob,
      passport_details: {
        passportnumber,
      },
      email: email.toLowerCase(),
      password,
      clientId: client,
      age,
      phone,
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
      `Welcome Sir!! Your Document has been verified Successfully`
    );
  } else {
    const data = {
      document: document,
      fields: {
        firstname: firstname,
        middlename: middlename,
        lastname: lastname,
        dob: dob,
        passportnumber: passportnumber,
      },
    };
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Client-Secret": `${process.env.CLIENT_DRIVING_SECRET}`,
      Authorization: `Bearer ${access_token}`,
    };

    const repo = await axios.post(url, data, { headers });
    if (repo.status == 200 && repo.data.result == "N") {
      return res
        .status(200)
        .json({ success: false, message: repo.data.errors });
    }

    let user = await User.create({
      firstname,
      middlename,
      lastname,
      dob,
      passport_details: {
        passportnumber,
      },
      email: email.toLowerCase(),
      password,
      clientId: client,
      age,
      phone,
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
      `Welcome Sir!! Your Document has been verified Successfully`
    );
  }
});

exports.loginUser = catchAsyncError(async (req, res, next) => {
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
  user.card_details = undefined;
  sendData(user, 200, res, `${user.firstname} logged in successfully`);
});

exports.sendOtp = catchAsyncError(async (req, res, next) => {
  const { phone } = req.body;
  if (!phone)
    return res.status(400).json({ message: "Please enter the phone" });

  // const { status } = await sendOTP(`+91${phone}`);
  // if (status !== "pending")
  //   return res.status(500).json({ message: "Error sending OTP" });

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
  });
});

exports.verifyOtp = catchAsyncError(async (req, res, next) => {
  const { phone, code } = req.body;
  if (!code || !phone)
    return res
      .status(400)
      .json({ message: "Please enter the code & phone number" });

  // await verifyOTP(`+91${phone}`, code, res);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
});

exports.myProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.status(200).json({
    success: true,
    user,
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const {
    firstname,
    middlename,
    lastname,
    dob,
    email,
    age,
    phone,
    address,
    city,
    state,
    postal_code,
    shuburb,
  } = req.body;

  if (email) {
    email = email.toLowerCase();
  }

  let user = await User.findOne({ $or: [{ phone }, { email }] });

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
    phone,
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
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
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

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json({ success: true, message: "Password Changed Successfully" });
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const code = generateCode(6);

  await User.findOneAndUpdate({ email }, { temp_code: code });
  await resetPasswordCode(email, user.firstname, code);

  res.status(200).json({ message: "Code sent to your email." });
});

exports.validateCode = catchAsyncError(async (req, res, next) => {
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
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (!newPassword || !confirmPassword)
    return res.status(400).json({ message: "Please fill in all fields" });
  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword;
  await user.save();

  res.status(203).json({ message: "Password Updated Successfully." });
});

exports.getAllUserBids = catchAsyncError(async (req, res, next) => {
  const bids = await Bid.find({
    bidder: req.userId,
  })
    .populate({
      path: "auction",
      select:
        "car highest_bid auction_start auction_end status is_Seller_paid10_percent is_Winner_paid10_percent seller",
      populate: {
        path: "car",
        model: "Car",
        select:
          "model manufacture_company color fuel_type transmission_type images unique_identification_number",
      },
    })
    .sort({ createdAt: -1 });

  if (bids) {
    for (const bid of bids) {
      if (
        bid.auction &&
        bid.auction.is_Seller_paid10_percent === true &&
        bid.auction.is_Winner_paid10_percent === true
      ) {
        await bid.auction.populate(
          "seller",
          "firstname middlename lastname email phone"
        );
      }
    }
  }

  res.status(200).json({
    success: true,
    bids,
  });
});

exports.getAllUserAuctions = catchAsyncError(async (req, res, next) => {
  const auctions = await Auction.find({ seller: req.userId })
    .populate(
      "car",
      "model manufacture_company unique_identification_number fuel_type description odometer_reading drive_type images vehicle_type"
    )
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    auctions,
  });
});

exports.getUserAuctionDetails = catchAsyncError(async (req, res, next) => {
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
      "firstname middlename lastname email phone"
    );
  }

  res.status(200).json({ success: true, auction, bids });
});

exports.deleteUserAuction = catchAsyncError(async (req, res, next) => {
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
});

exports.getAllUserCars = catchAsyncError(async (req, res, next) => {
  const cars = await Car.find({ seller: req.userId }).sort({ createdAt: -1 });
  if (!cars) return res.status(404).json({ message: "Cars not found" });

  res.status(200).json({ success: true, cars });
});

exports.getSellerWonAuction = catchAsyncError(async (req, res, next) => {
  const auctions = await Auction.find({ seller: req.userId })
    .sort({
      createdAt: -1,
    })
    .populate("car", "unique_identification_number images");

  let wonAuctions = [];
  if (auctions) {
    wonAuctions = auctions.filter((auction) => auction.status === "sold");
  }
  res.status(200).json({ success: true, wonAuctions });
});

exports.getBuyerWonAuction = catchAsyncError(async (req, res, next) => {
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
          "firstname middlename lastname email phone"
        );
      }
      return bid;
    })
  );

  res.status(200).json({ success: true, wonBuyerAuctions: processedBids });
});

exports.getUserTransactions = catchAsyncError(async (req, res, next) => {
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

  res.status(200).json({ success: true, transactions });
});
