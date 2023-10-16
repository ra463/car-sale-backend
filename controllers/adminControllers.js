const Car = require("../models/Car");
const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    if (!users) return res.status(404).json({ message: "Users not found" });

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find({});
    if (!cars) return res.status(404).json({ message: "Cars not found" });

    res.status(200).json({ success: true, cars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
