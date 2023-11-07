const Car = require("../models/Car");
const User = require("../models/User");
const Auction = require("../models/Auction");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Bid = require("../models/Bid");

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    user,
    token,
  });
};

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid email or password", 401));

  if (user.role !== "admin")
    return next(new ErrorHandler("Unauthorized user login.", 401));

  const isMatch = await user.matchPassword(password);
  if (!isMatch)
    return next(new ErrorHandler("Invalid email or password!", 401));

  sendData(user, 200, res);
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const userCount = await User.countDocuments();
  const apiFeature = new APIFeatures(
    User.find().sort({ createdAt: -1 }),
    req.query
  ).search("name");

  let users = await apiFeature.query;

  const filteredUserCount = users.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();
    users = await apiFeature.query.clone();
  }

  res.status(200).json({
    success: true,
    users,
    userCount,
    filteredUserCount,
  });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found!", 404));

  res.status(200).json({
    user,
  });
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found!", 404));

  const { name, email, role, age, phoneNumber, address } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (age) user.age = age;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (address) user.address = address;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully!",
  });
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found!", 404));

  // delete all the cars of this user
  const cars = await Car.find({ seller: user._id });
  if (cars.length > 0) {
    cars.forEach(async (car) => {
      car.images.forEach(async (image) => {
        await s3delete(image, user._id);
      });
      await car.remove();
    });
  }

  // delete all the auctions of this user
  const auctions = await Auction.find({ seller: user._id });
  if (auctions.length > 0) {
    auctions.forEach(async (auction) => {
      // delete all the bids of this auction
      const bids = await Bid.find({ auction: auction._id });
      bids.forEach(async (bid) => {
        await bid.remove();
      });
      await auction.remove();
    });
  }

  // delete all the bids of this user
  const bids = await Bid.find({ bidder: user._id });
  if (bids.length > 0) {
    bids.forEach(async (bid) => {
      await bid.remove();
    });
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User deleted successfully!",
  });
});

exports.getAllCars = catchAsyncError(async (req, res, next) => {
  const carCount = await Car.countDocuments();
  const apiFeatures = new APIFeatures(
    Car.find().sort({ createdAt: -1 }),
    req.query
  ).search("model");

  let cars = await apiFeatures.query;

  const filteredCarCount = cars.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeatures.pagination();
    cars = await apiFeatures.query.clone();
  }

  res.status(200).json({
    success: true,
    cars,
    carCount,
    filteredCarCount,
  });
});

exports.getCarById = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.id);
  if (!car) return next(new ErrorHandler("Car not found!", 404));

  res.status(200).json({
    success: true,
    car,
  });
});

exports.updateCar = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.id).populate("seller");
  if (!car) return next(new ErrorHandler("Car not found!", 404));

  const {
    manufacture_company,
    registration_date,
    model,
    manufacture_year,
    registration_no,
    unique_identification_number,
    color,
    fuel_type,
    transmission_type,
    engine_capacity,
    odometer_reading,
    drive_type,
    num_of_cylinders,
    description,
    sellerStreet,
    sellerCity,
    sellerLandmark,
    carLocationStreet,
    carLocationCity,
    carLocationLandmark,
  } = req.body;

  if (unique_identification_number.length !== 17)
    return res.status(400).json({ message: "VIN must be of 17 characters" });

  const car2 = await Car.findOne({
    unique_identification_number: unique_identification_number,
  });

  if (car2 && car2._id.toString() !== car._id.toString()) {
    return res.status(400).json({ message: "VIN already exists" });
  }

  const files = req.files;

  let all_images = [];
  if (files) {
    const result = await s3UploadMulti(files, car.seller._id);
    const location = result.map((item) => item.Location);
    all_images.push(...location);
  }

  if (manufacture_company) car.manufacture_company = manufacture_company;
  if (registration_date) car.registration_date = registration_date;
  if (model) car.model = model;
  if (manufacture_year) car.manufacture_year = manufacture_year;
  if (registration_no) car.registration_no = registration_no;
  if (unique_identification_number)
    car.unique_identification_number = unique_identification_number;
  if (color) car.color = color;
  if (fuel_type) car.fuel_type = fuel_type;
  if (transmission_type) car.transmission_type = transmission_type;
  if (engine_capacity) car.engine_capacity = engine_capacity;
  if (odometer_reading) car.odometer_reading = odometer_reading;
  if (drive_type) car.drive_type = drive_type;
  if (num_of_cylinders) car.num_of_cylinders = num_of_cylinders;
  if (description) car.description = description;
  if (sellerStreet) car.sellerStreet = sellerStreet;
  if (sellerCity) car.sellerCity = sellerCity;
  if (sellerLandmark) car.sellerLandmark = sellerLandmark;
  if (carLocationStreet) car.carLocationStreet = carLocationStreet;
  if (carLocationCity) car.carLocationCity = carLocationCity;
  if (carLocationLandmark) car.carLocationLandmark = carLocationLandmark;
  if (all_images.length > 0) car.images = all_images;

  res.status(201).json({
    success: true,
    message: "Car updated successfully",
  });
});

exports.deleteCar = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.id);
  if (!car) return next(new ErrorHandler("Car not found!", 404));

  car.images.forEach(async (image) => {
    await s3delete(image, car.seller._id);
  });

  await car.remove();

  res.status(200).json({
    success: true,
    message: "Car deleted successfully!",
  });
});

exports.getAllAdminsAuctions = catchAsyncError(async (req, res, next) => {
  const auctionCount = await Auction.countDocuments();
  const apiFeatures = new APIFeatures(
    Auction.find().populate("highest_bid").sort({ createdAt: -1 }),
    req.query
  ).search("status");

  let auctions = await apiFeatures.query;

  const filteredAuctionCount = auctions.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeatures.pagination();
    auctions = await apiFeatures.query.clone();
  }

  res.status(200).json({
    success: true,
    auctions,
    auctionCount,
    filteredAuctionCount,
  });
});

exports.getAdminAuctionById = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findById(req.params.id).populate(
    "bids car seller highest_bid"
  );
  if (!auction) return next(new ErrorHandler("Auction not found!", 404));

  res.status(200).json({
    success: true,
    auction,
  });
});

exports.deleteAuction = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return next(new ErrorHandler("Auction not found!", 404));

  // also delete all the bids of this auction
  const bids = await Bid.find({ auction: auction._id });
  bids.forEach(async (bid) => {
    await bid.deleteOne();
  });

  await auction.deleteOne();

  res.status(200).json({
    success: true,
    message: "Auction deleted successfully!",
  });
});

exports.getAllBids = catchAsyncError(async (req, res, next) => {
  const bidCount = await Bid.countDocuments();
  const apiFeatures = new APIFeatures(
    Bid.find().populate("bidder").sort({ createdAt: -1 }),
    req.query
  ).search("bid_amount");

  let bids = await apiFeatures.query;

  const filteredBidCount = bids.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeatures.pagination();
    bids = await apiFeatures.query.clone();
  }

  res.status(200).json({
    success: true,
    bids,
    bidCount,
    filteredBidCount,
  });
});

exports.getBidById = catchAsyncError(async (req, res, next) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return next(new ErrorHandler("Bid not found!", 404));

  res.status(200).json({
    success: true,
    bid,
  });
});

exports.deleteBid = catchAsyncError(async (req, res, next) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return next(new ErrorHandler("Bid not found!", 404));

  const auction = await Auction.findById(bid.auction).populate(
    "bids highest_bid"
  );
  if (!auction) return next(new ErrorHandler("Auction not found!", 404));

  if (auction.bids.length === 1) {
    await bid.deleteOne();
    auction.bids = [];
    auction.highest_bid = null;
    await auction.save();
  }

  if (auction.bids.length > 1) {
    const index = auction.bids.findIndex((bid) => bid === req.params.id);
    auction.bids.splice(index, 1);

    if (auction.highest_bid._id.toString() === req.params.id) {
      auction.highest_bid = auction.bids[0]._id;
    }
    await bid.deleteOne();
    await auction.save();
  }

  res.status(200).json({
    success: true,
    message: "Bid deleted successfully!",
  });
});

exports.getAdminStats = catchAsyncError(async (req, res, next) => {
});