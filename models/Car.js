const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    manufacture_company: {
      type: String,
      required: [true, "Make is required"],
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
    num_of_km_run: {
      type: Number,
      required: [true, "How many kilometers has the car run?"],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    images: {
      type: Array,
      required: [true, "Images are required"],
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    bids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bid",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Car = mongoose.model("Car", schema);
