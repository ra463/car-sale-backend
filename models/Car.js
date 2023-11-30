const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    vehicle_type: {
      type: String,
      enum: ["Car", "Truck"],
      default: "Car",
    },
    manufacture_company: {
      type: String,
      required: [true, "Make is required"],
    },
    is_registered: {
      type: Boolean,
      default: true,
      required: true,
    },
    expiry_date: {
      type: String,
    },
    owner: {
      type: Boolean,
    },
    autorized_person: {
      type: Boolean,
    },
    body_type: {
      type: String,
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
      unique: [true, "VIN already exists"],
    },
    axle_configuration: {
      type: String,
    },
    gvm: {
      type: Number, // in kg
    },
    color: {
      type: String,
    },
    fuel_type: {
      type: String,
      required: [true, "Fuel type is required"],
    },
    transmission_type: {
      type: String,
      enum: ["Automatic", "Manual"],
    },
    engine_capacity: {
      type: Number, // in cc
    },
    engine_power: {
      type: Number, // in HP
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    odometer_reading: {
      type: Number,
      required: [true, "Odometer reading is required"],
    },
    drive_type: {
      type: String,
    },
    num_of_cylinders: {
      type: Number,
    },
    key_highlights: {
      type: Array,
    },
    car_address: {
      type: String,
    },
    car_city: {
      type: String,
    },
    car_state: {
      type: String,
    },
    car_postal_code: {
      type: String,
    },
    isAuction_created: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Car", schema, "cars");
