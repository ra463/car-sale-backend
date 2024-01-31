const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is Required"],
    },
    email: {
      type: String,
      required: [true, "Email is Required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is Required"],
      maxLength: [11, "Phone number must be 9 to 11 digits long"],
      minLength: [9, "Phone number must be 9 to 11 digits long"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is Required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Query", querySchema);
