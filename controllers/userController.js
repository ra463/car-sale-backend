const Car = require("../models/Car");
const User = require("../models/User");
const { generateUsername } = require("../utils/generateUsername");

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    user,
    token,
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, age, phoneNumber, address } = req.body;

    if (!name || !email || !password || !age || !phoneNumber || !address) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    if (phoneNumber.length !== 10)
      return res
        .status(400)
        .json({ message: "Mobile number must be of 10 digits" });

    let user = await User.findOne({ email });
    let user2 = await User.findOne({ phoneNumber });
    if (user)
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    if (user2) return res.status(400).json({ message: "User with this number already exists" });

    const split = name.split(" ")[0];
    let username = await generateUsername(split);

    user = await User.create({
      name,
      email,
      password,
      username: username,
      age,
      phoneNumber,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully, now you can login.",
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordMatched = await user.matchPassword(password);
    if (!isPasswordMatched)
      return res.status(400).json({ message: "Invalid credentials" });

    user.password = undefined;
    sendData(user, 200, res);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.myProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found:k" });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, age, phoneNumber, address } = req.body;

    let user = await User.findOne({ phoneNumber });
    if (user) return res.status(400).json({ message: "Some User already exists with this number" });

    const newUserData = {
      name,
      email,
      age,
      phoneNumber,
      address,
    };

    await User.findByIdAndUpdate(req.userId, newUserData, {
      new: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findById(req.userId).select("+password");
    const isMatched = await user.matchPassword(oldPassword);
    if (!isMatched)
      return res.status(400).json({ message: "Invalid OldPassword password" });

    const isPasswordMatched = await user.matchPassword(newPassword);
    if (isPasswordMatched)
      return res
        .status(400)
        .json({ message: "New password cannot be the same as old password" });
    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password Changed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
