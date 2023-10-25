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

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorHandler("User not found!", 404));

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

exports.deleteCar = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.id);
  if (!car) return next(new ErrorHandler("Car not found!", 404));

  await car.remove();

  res.status(200).json({
    success: true,
    message: "Car deleted successfully!",
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
    economy,
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
  if (economy) car.economy = economy;
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
