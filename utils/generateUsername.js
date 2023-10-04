const User = require("../models/User");

exports.generateUsername = async (username) => {
  const user = await User.findOne({ username });
  if (user) {
    username += (+new Date() * Math.random()).toString().substring(0, 1);
    return generateUsername(username);
  }
  return username;
};
