const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    manufacture_company: {
      type: String,
      required: [true, "Make is required"],
      trim: true,
    },
    registration_date: {
      type: String,
      required: [true, "Registration date is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    manufacture_year: {
      type: Number,
      required: [true, "Year is required"],
      trim: true,
    },
    unique_identification_number: {
      type: String,
      required: [true, "Vehicle Identification Number is required"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
    },
    fuel_type: {
      type: String,
      required: [true, "Fuel type is required"],
    },
    transmission_type: {
      type: String,
      required: [true, "Transmission type is required"],
      trim: true,
    },
    engine_capacity: {
      type: Number, // in cc
      required: [true, "Engine capacity is required"],
    },
    economy: {
      type: Number, //in kmpl
      required: [true, "Economy is required"],
    },
    description: {
      type: String,
    },
    odometer_reading: {
      type: Number,
      required: [true, "Odometer reading is required"],
    },
    drive_type: {
      type: String,
      enum: ["AWD", "FWD", "RWD", "4WD"],
      required: [true, "Drive type is required"],
    },
    num_of_cylinders: {
      type: Number,
      required: [true, "Number of cylinders is required"],
    },
    key_highlights: {
      type: Array,
    },
    images: {
      type: Array,
      required: [true, "Images are required"],
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Car", schema);
