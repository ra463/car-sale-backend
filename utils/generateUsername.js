const User = require("../models/User");

exports.generateUsername = async (username) => {
  const user = await User.findOne({ username });
  if (user) {
    const random = Math.floor(Math.random() * 1000);
    return `${username}${random}`;
  }
  return username;
};
