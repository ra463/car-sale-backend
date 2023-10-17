const Car = require("../models/Car");
const User = require("../models/User");
const { s3UploadMulti, s3delete } = require("../utils/s3");

exports.uploadCarDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      manufacture_company,
      registration_date,
      model,
      manufacture_year,
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
    } = req.body;

    if (unique_identification_number.length !== 17)
      return res.status(400).json({ message: "VIN must be of 17 characters" });

    const files = req.files;

    let all_images = [];
    if (files) {
      const result = await s3UploadMulti(files, user._id);
      const location = result.map((item) => item.Location);
      all_images.push(...location);
    }

    const car = await Car.create({
      manufacture_company,
      registration_date,
      model,
      manufacture_year,
      unique_identification_number,
      color,
      fuel_type,
      transmission_type,
      engine_capacity,
      economy,
      odometer_reading,
      drive_type,
      num_of_cylinders,
      seller: user._id,
      description,
      images: all_images,
    });

    user.cars.unshift(car._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Car details uploaded successfully",
      car,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addKeyFeatures = async (req, res) => {
  try {
    const { keyFeatures } = req.body;
    if (!keyFeatures)
      return res.status(400).json({ message: "Please fill in all fields" });
    const car = await Car.findById(req.params.carId);

    if (!car) return res.status(404).json({ message: "Car not found" });
    car.key_highlights.push(keyFeatures);

    await car.save();
    res.status(200).json({
      success: true,
      message: "Key features added successfully",
      car,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.uploadMoreCarImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files)
      return res.status(400).json({ message: "Please select image(s)" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const result = await s3UploadMulti(files, user._id);
    const location = result.map((item) => item.Location);
    car.images.push(...location);

    await car.save();

    res.status(201).json({
      success: true,
      message: "Car images uploaded successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCarImage = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const index = car.images.findIndex((image) => image === req.body.image);
    if (index === -1)
      return res.status(404).json({ message: "Image not found" });

    await s3delete(req.body.image, user._id);
    car.images.splice(index, 1);
    await car.save();

    res.status(200).json({
      success: true,
      message: "Car image deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    // delete all images
    for (let i = 0; i < car.images.length; i++) {
      await s3delete(car.images[i], user._id);
    }

    await car.deleteOne();

    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCarDetails = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    res.status(200).json({
      success: true,
      car,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCarImages = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    res.status(200).json({
      success: true,
      images: car.images,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.editCarDetails = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const {
      manufacture_company,
      registration_date,
      model,
      manufacture_year,
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
    } = req.body;

    if (
      unique_identification_number &&
      unique_identification_number.length !== 17
    )
      return res.status(400).json({ message: "VIN must be of 17 characters" });

    if (manufacture_company) car.manufacture_company = manufacture_company;
    if (registration_date) car.registration_date = registration_date;
    if (model) car.model = model;
    if (manufacture_year) car.manufacture_year = manufacture_year;
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

    await car.save();
    res.status(200).json({
      success: true,
      message: "Car details updated successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find({});
    res.status(200).json({
      success: true,
      cars,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
