const Car = require("../models/Car");
const User = require("../models/User");
const Auction = require("../models/Auction");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Bid = require("../models/Bid");
const Transaction = require("../models/Transaction");
const Query = require("../models/Query");
const { s3delete } = require("../utils/s3");

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
  ).search("clientId");

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

  const {
    name,
    email,
    role,
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
    return res.status(400).json({ message: "Your age must be 18 or above 18" });
  }

  const user2 = await User.findOne({ phoneNumber: phoneNumber });
  if (user2 && user2._id.toString() !== user._id.toString()) {
    return res
      .status(400)
      .json({ message: "User already exists with this phone number" });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (age) user.age = age;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (address) user.address = address;
  if (city) user.city = city;
  if (state) user.state = state;
  if (postal_code) user.postal_code = postal_code;
  if (shuburb) user.shuburb = shuburb;

  await user.save();

  res.status(200).json({
    success: true,
    user,
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
      await car.deleteOne();
    });
  }

  // delete all the auctions of this user
  const auctions = await Auction.find({ seller: user._id });
  if (auctions.length > 0) {
    auctions.forEach(async (auction) => {
      // delete all the bids of this auction
      const bids = await Bid.find({ auction: auction._id });
      bids.forEach(async (bid) => {
        await bid.deleteOne();
      });
      await auction.deleteOne();
    });
  }

  // delete all the bids of this user
  const bids = await Bid.find({ bidder: user._id });
  if (bids.length > 0) {
    bids.forEach(async (bid) => {
      await bid.deleteOne();
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully!",
  });
});

exports.getAllCars = catchAsyncError(async (req, res, next) => {
  let query = {};
  if (req.query.vehicle_type !== "all")
    query.vehicle_type = req.query.vehicle_type;
  const carCount = await Car.countDocuments();

  const apiFeatures = new APIFeatures(
    Car.find(query).sort({ createdAt: -1 }),
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
  const car = await Car.findById(req.params.id).populate(
    "seller",
    "name email phoneNumber age address city state postal_code shuburb clientId"
  );
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
    model,
    manufacture_year,
    expiry_date,
    unique_identification_number,
    color,
    owner,
    autorized_person,
    body_type,
    axle_configuration,
    gvm,
    engine_power,
    fuel_type,
    transmission_type,
    engine_capacity,
    odometer_reading,
    drive_type,
    num_of_cylinders,
    description,
    car_address,
    car_city,
    car_state,
    car_postal_code,
    is_registered,
    car_shuburb,
  } = req.body;

  if (
    unique_identification_number &&
    unique_identification_number.length !== 17
  )
    return res.status(400).json({ message: "VIN must be of 17 characters" });

  if (unique_identification_number) {
    const carExists = await Car.findOne({
      unique_identification_number: unique_identification_number,
    });

    if (carExists._id.toString() !== car._id.toString()) {
      return res
        .status(400)
        .json({ message: "Vehicle already exists with this Vin" });
    }
  }

  if (car.vehicle_type === "Car") {
    if (manufacture_company) car.manufacture_company = manufacture_company;
    if (model) car.model = model;
    if (manufacture_year) car.manufacture_year = manufacture_year;
    if (unique_identification_number)
      car.unique_identification_number = unique_identification_number;
    if (color) car.color = color;
    if (fuel_type) car.fuel_type = fuel_type;
    if (transmission_type) car.transmission_type = transmission_type;
    if (engine_capacity) car.engine_capacity = engine_capacity;
    if (odometer_reading) car.odometer_reading = odometer_reading;
    if (drive_type) car.drive_type = drive_type;
    if (num_of_cylinders) car.num_of_cylinders = num_of_cylinders;
    if (car_address) car.car_address = car_address;
    if (car_city) car.car_city = car_city;
    if (car_state) car.car_state = car_state;
    if (car_postal_code) car.car_postal_code = car_postal_code;
    if (car_shuburb) car.car_shuburb = car_shuburb;
    if (description) car.description = description;
    if (is_registered) car.is_registered = is_registered;
    if (is_registered === "true") car.expiry_date = expiry_date;
    if (is_registered === "false") car.expiry_date = null;
    if (body_type) car.body_type = body_type;
    if (owner) car.owner = owner;
    if (autorized_person) car.autorized_person = autorized_person;
    await car.save();
  }

  if (car.vehicle_type === "Truck") {
    if (manufacture_company) car.manufacture_company = manufacture_company;
    if (model) car.model = model;
    if (manufacture_year) car.manufacture_year = manufacture_year;
    if (unique_identification_number)
      car.unique_identification_number = unique_identification_number;
    if (color) car.color = color;
    if (fuel_type) car.fuel_type = fuel_type;
    if (transmission_type) car.transmission_type = transmission_type;
    if (odometer_reading) car.odometer_reading = odometer_reading;
    if (drive_type) car.drive_type = drive_type;
    if (num_of_cylinders) car.num_of_cylinders = num_of_cylinders;
    if (car_address) car.car_address = car_address;
    if (car_city) car.car_city = car_city;
    if (car_state) car.car_state = car_state;
    if (car_postal_code) car.car_postal_code = car_postal_code;
    if (car_shuburb) car.car_shuburb = car_shuburb;
    if (description) car.description = description;
    if (is_registered) car.is_registered = is_registered;
    if (is_registered === "true") car.expiry_date = expiry_date;
    if (body_type) car.body_type = body_type;
    if (owner) car.owner = owner;
    if (autorized_person) car.autorized_person = autorized_person;
    if (axle_configuration) car.axle_configuration = axle_configuration;
    if (gvm) car.gvm = gvm;
    if (engine_power) car.engine_power = engine_power;
    await car.save();
  }

  res.status(201).json({
    success: true,
    message: "Vehicle updated successfully",
  });
});

exports.deleteCar = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.id);
  if (!car) return next(new ErrorHandler("Vehicle not found!", 404));

  if (car.isAuction_created === true) {
    return res.status(400).json({
      message: "Vehicle is in auction. You cannot delete this Vehicle",
    });
  }

  car.images.forEach(async (image) => {
    await s3delete(image, car.seller._id);
  });

  // delete all the auctions of this car
  const auctions = await Auction.find({ car: car._id });
  if (auctions.length > 0) {
    auctions.forEach(async (auction) => {
      // delete all the bids of this auction
      const bids = await Bid.find({ auction: auction._id });
      bids.forEach(async (bid) => {
        await bid.deleteOne();
      });
      await auction.deleteOne();
    });
  }

  await car.deleteOne();

  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully!",
  });
});

exports.getAllAdminsAuctions = catchAsyncError(async (req, res, next) => {
  let query = {};
  if (req.query.status !== "all") query.status = req.query.status;
  const auctionCount = await Auction.countDocuments();
  const apiFeatures = new APIFeatures(
    Auction.find(query).populate("seller", "name").sort({ createdAt: -1 }),
    req.query
  ).search("auction_id");

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
  const auction = await Auction.findById(req.params.id)
    .populate(
      "seller",
      "name email phoneNumber age address city state postal_code shuburb clientId"
    )
    .populate("car");
  if (!auction) return next(new ErrorHandler("Auction not found!", 404));

  const bids = await Bid.find({ auction: auction._id })
    .populate("bidder", "name")
    .sort({
      createdAt: -1,
    });

  let winner = null;
  if (bids.length > 0) {
    winner = await bids[0].populate(
      "bidder",
      "name email phoneNumber age address city state postal_code shuburb clientId"
    );
  }

  res.status(200).json({
    success: true,
    auction,
    bids,
    winner: winner === null ? null : winner.bidder,
  });
});

exports.deleteAuction = catchAsyncError(async (req, res, next) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return next(new ErrorHandler("Auction not found!", 404));

  if (auction.status === "active")
    return res
      .status(400)
      .json({ message: "Auction is active. You cannot delete this Auction" });

  // also delete all the bids of this auction
  const bids = await Bid.find({ auction: auction._id });
  bids.forEach(async (bid) => {
    await bid.deleteOne();
  });

  const car = await Car.findById(auction.car);
  car.isAuction_created = false;
  await car.save();
  await auction.deleteOne();

  res.status(200).json({
    success: true,
    message: "Auction deleted successfully!",
  });
});

exports.getAllBids = catchAsyncError(async (req, res, next) => {
  const bidCount = await Bid.countDocuments();
  const apiFeatures = new APIFeatures(
    Bid.find()
      .populate("auction", "auction_id")
      .populate("bidder")
      .sort({ createdAt: -1 }),
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

  const auction = await Auction.findById(bid.auction);
  if (!auction) return next(new ErrorHandler("Auction not found!", 404));

  if (auction.highest_bid === bid.bid_amount) {
    await bid.deleteOne();
    const bids = await Bid.find({ auction: auction._id }).sort({
      createdAt: -1,
    });
    if (bids.length === 0) {
      auction.highest_bid = 0;
      await auction.save();
    } else {
      auction.highest_bid = bids[0].bid_amount;
      await auction.save();
    }
  } else {
    await bid.deleteOne();
  }

  res.status(200).json({
    success: true,
    message: "Bid deleted successfully!",
  });
});

exports.unlockUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return next(new ErrorHandler("User not found!", 404));

  if (user.is_locked === false) {
    return next(new ErrorHandler("User is already Unlocked", 400));
  }

  user.is_locked = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User unlocked successfully!",
  });
});

exports.getStatistics = catchAsyncError(async (req, res, next) => {
  const { time } = req.params;
  const date = new Date();
  date.setHours(24, 0, 0, 0);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let startDate = new Date(date.getFullYear(), 0, 1);
  var days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  var week = Math.ceil(days / 7);

  if (time == "all") {
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const cars = await Car.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const auctions = await Auction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const bids = await Bid.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const queries = await Query.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const transactions = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const amount = await Transaction.aggregate([
      {
        $project: {
          amount: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.send({
      users: users,
      cars: cars,
      auctions: auctions,
      bids: bids,
      queries: queries,
      transactions: transactions,
      amount: amount,
    });
  }

  if (time == "daily") {
    const users = await User.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const cars = await Car.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const auctions = await Auction.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const bids = await Bid.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const queries = await Query.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const transactions = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const amount = await Transaction.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.send({
      users: users,
      cars: cars,
      auctions: auctions,
      bids: bids,
      queries: queries,
      transactions: transactions,
      amount: amount,
    });
  }
  if (time == "weekly") {
    const users = await User.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const cars = await Car.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const auctions = await Auction.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const bids = await Bid.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const queries = await Query.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const transactions = await Transaction.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const amount = await Transaction.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.send({
      users: users,
      cars: cars,
      auctions: auctions,
      bids: bids,
      queries: queries,
      transactions: transactions,
      amount: amount,
    });
  }

  if (time == "monthly") {
    const users = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const cars = await Car.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const auctions = await Auction.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const bids = await Bid.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const queries = await Query.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const transactions = await Transaction.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);

    const amount = await Transaction.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.send({
      users: users,
      cars: cars,
      auctions: auctions,
      bids: bids,
      queries: queries,
      transactions: transactions,
      amount: amount,
    });
  }
});
