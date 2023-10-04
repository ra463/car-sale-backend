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

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    let username = await generateUsername(name);

    user = await User.create({
      username,
      name,
      email,
      password,
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
