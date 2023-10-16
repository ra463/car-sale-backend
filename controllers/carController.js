const Car = require("../models/Car");
const User = require("../models/User");
const { s3UploadMulti } = require("../utils/s3");

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
    let images = [];
    const result = await s3UploadMulti(files, user._id);
    const location = result.map((item) => item.Location);
    images.push(...location);

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
      images,
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

exports.uploadCarImages = async (req, res) => {
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
