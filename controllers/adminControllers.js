const Car = require("../models/Car");
const User = require("../models/User");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

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
