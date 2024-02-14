const Car = require("../models/Car");
const User = require("../models/User");
const { s3UploadMulti, s3delete } = require("../utils/s3");
const catchAsyncError = require("../utils/catchAsyncError");

exports.uploadCarDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const {
    manufacture_company,
    vehicle_type,
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
    images_url,
  } = req.body;

  let image_url = images_url;

  if (vehicle_type !== "Car" && vehicle_type !== "Truck") {
    return res
      .status(400)
      .json({ message: "Vehicle type must be Car or Truck" });
  }

  const car_exists = await Car.findOne({ unique_identification_number });

  if (car_exists)
    return res
      .status(400)
      .json({ message: "Vehicle already exists with this Vin" });

  // const files = req.files;

  // let all_images = [];
  // if (files) {
  //   const result = await s3UploadMulti(files, user._id);
  //   const location = result.map((item) => item.Location);
  //   all_images.push(...location);
  // }

  if (vehicle_type === "Car") {
    await Car.create({
      manufacture_company,
      vehicle_type,
      model,
      manufacture_year,
      unique_identification_number,
      color,
      fuel_type,
      transmission_type,
      engine_capacity,
      odometer_reading,
      drive_type,
      num_of_cylinders,
      car_address,
      car_city,
      car_state,
      car_postal_code,
      car_shuburb,
      seller: user._id,
      description,
      images: image_url,
      is_registered,
      expiry_date: is_registered === "true" ? expiry_date : null,
      body_type,
      owner,
      autorized_person,
    });
  }

  if (vehicle_type === "Truck") {
    if (!gvm) return res.status(400).json({ message: "GVM is required" });
    if (!engine_power)
      return res.status(400).json({ message: "Engine power is required" });
    if (!axle_configuration)
      return res
        .status(400)
        .json({ message: "Axle configuration is required" });

    await Car.create({
      vehicle_type,
      manufacture_company,
      model,
      manufacture_year,
      unique_identification_number,
      color,
      fuel_type,
      transmission_type,
      odometer_reading,
      drive_type,
      num_of_cylinders,
      car_address,
      car_city,
      car_state,
      car_postal_code,
      car_shuburb,
      seller: user._id,
      description,
      images: image_url,
      is_registered,
      expiry_date: is_registered === "true" ? expiry_date : null,
      body_type,
      axle_configuration,
      gvm,
      engine_power,
      owner,
      autorized_person,
    });
  }

  res.status(201).json({
    success: true,
    message: "Vehicle uploaded successfully",
  });
});

exports.addKeyFeatures = catchAsyncError(async (req, res, next) => {
  const { keyFeatures } = req.body;
  if (!keyFeatures)
    return res.status(400).json({ message: "Please fill in all fields" });
  const car = await Car.findById(req.params.carId);

  if (!car) return res.status(404).json({ message: "Vehicle not found" });
  car.key_highlights.push(keyFeatures);

  await car.save();
  res.status(200).json({
    success: true,
    message: "Key features added successfully",
  });
});

exports.uploadCarImages = catchAsyncError(async (req, res, next) => {
  const files = req.files;
  if (!files)
    return res.status(400).json({ message: "Please select image(s)" });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const result = await s3UploadMulti(files, user._id);
  const location = result.map((item) => item.Location);
  // car.images.push(...location);

  // await car.save();

  res.status(201).json({
    success: true,
    message: "Vehicle images uploaded",
    location,
  });
});

exports.pushCarImagesIntoArray = catchAsyncError(async (req, res, next) => {
  const { images_url } = req.body;
  if (!images_url) return res.status(404).json({ message: "Url not pushed" });

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  const car = await Car.findById(req.params.carId);
  if (!car) return res.status(404).json({ message: "Vehicle not found" });

  car.images.push(...images_url);
  car.save();

  res.status(200).json({
    success: true,
    message: "Images Uploded successfully",
  });
});

exports.removeUplodedCarImages = catchAsyncError(async (req, res, next) => {
  const { img } = req.body;
  if (!img) return res.status(400).json({ message: "Please select image" });
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  await s3delete(img, user._id);

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

exports.deleteCarImage = catchAsyncError(async (req, res, next) => {
  const { img } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  const car = await Car.findById(req.params.carId);
  if (!car) return res.status(404).json({ message: "Vehicle not found" });

  const index = car.images.findIndex((image) => image === img);
  if (index === -1) return res.status(404).json({ message: "Image not found" });

  await s3delete(img, user._id);
  car.images.splice(index, 1);
  await car.save();

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

exports.deleteCar = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  const car = await Car.findById(req.params.carId);
  if (!car) return res.status(404).json({ message: "Vehicle not found" });

  if (car.seller.toString() !== user._id.toString())
    return res.status(400).json({ message: "You are not the seller" });

  if (car.isAuction_created === true)
    return res.status(400).json({
      message:
        "You cannot delete this car as auction is already created for this Vehicle",
    });

  // delete all images
  for (let i = 0; i < car.images.length; i++) {
    await s3delete(car.images[i], user._id);
  }

  await car.deleteOne();

  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully",
  });
});

exports.getCarDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.userId);
  const car = await Car.findById(req.params.carId);
  if (!car) return res.status(404).json({ message: "Vehicle not found" });

  if (user._id.toString() !== car.seller.toString())
    return res
      .status(400)
      .json({ message: "You are not the seller of this Car" });

  res.status(200).json({
    success: true,
    car,
  });
});

exports.getAllUniqueCarNames = catchAsyncError(async (req, res, next) => {
  const cars = await Car.find({});
  const uniqueNames = [...new Set(cars.map((car) => car.manufacture_company))];

  const uniqueFuelTypes = [...new Set(cars.map((car) => car.fuel_type))];
  const uniqueModelTypes = [...new Set(cars.map((car) => car.model))];

  res.status(200).json({
    success: true,
    uniqueNames,
    uniqueFuelTypes,
    uniqueModelTypes,
  });
});

exports.getCarImages = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.carId);
  if (!car) return res.status(404).json({ message: "Vehicle not found" });

  res.status(200).json({
    success: true,
    images: car.images,
  });
});

exports.editCarDetails = catchAsyncError(async (req, res, next) => {
  const car = await Car.findById(req.params.carId);
  if (!car) return res.status(404).json({ message: "Vehicle not found" });

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

  const carExists = await Car.findOne({ unique_identification_number });

  if (carExists._id.toString() !== car._id.toString()) {
    return res
      .status(400)
      .json({ message: "Vehicle already exists with this Vin" });
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
    if (is_registered === "false") car.expiry_date = null;
    if (body_type) car.body_type = body_type;
    if (owner) car.owner = owner;
    if (autorized_person) car.autorized_person = autorized_person;
    if (axle_configuration) car.axle_configuration = axle_configuration;
    if (gvm) car.gvm = gvm;
    if (engine_power) car.engine_power = engine_power;
    await car.save();
  }

  res.status(200).json({
    success: true,
    message: "Details updated successfully",
  });
});

exports.getAllCars = catchAsyncError(async (req, res, next) => {
  const cars = await Car.find();
  res.status(200).json({
    success: true,
    cars,
  });
});
