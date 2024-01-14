const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config();

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).send({
        error: {
          message: "Unauthorized: Please login first",
        },
      });

    const { userId } = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );

    req.userId = userId;

    const userValid = await User.find({ _id: userId });
    if (!userValid) {
      return res.status(401).send({ error: { message: `Unauthorized` } });
    }
    next();
  } catch (error) {
    return res.status(401).send({ error: { message: `Unauthorized` } });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("+password");
    if (!user) return res.status(403).json({ message: "User Not Found" });

    if (user.role !== "admin")
      return res.status(403).json({ message: "Forbidden:Admin Only" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized:Admin Only" });
  }
};
