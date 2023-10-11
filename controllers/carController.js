const Car = require("../models/Car");
const User = require("../models/User");

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
    const car = await Car.findById(req.params.id);

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

exports.getCarDetails = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });

    res.status(200).json({
      success: true,
      car,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserAllCars = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("cars");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success:true,
      cars: user.cars,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};