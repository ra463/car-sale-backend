const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const schema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      // required: [true, "Firstname is required"],
    },
    middlename: {
      type: String,
      default: "",
    },
    lastname: {
      type: String,
      // required: [true, "Name is required"],
    },
    dob: {
      type: String,
      // required: true,
    },
    licence_state: {
      type: String,
      enum: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"],
    },
    licencenumber: {
      type: String,
    },
    cardnumberback: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be atleast 8 characters"],
      trim: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    clientId: {
      type: String,
      unique: [true, "Client Id already exists"],
    },
    profilePicUrl: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh1MxDvWeEQ39D04ETGLuJ_pnSkd_gZf47R7qkQaxbHotxVs-aBvYjsHmbvxcKhTGn9gI&usqp=CAU",
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      minLength: [18, "Age must be 18 or above"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: [true, "Phone number already exists"],
      maxLength: [11, "Phone number must be 9 to 11 digits long"],
      minLength: [9, "Phone number must be 9 to 11 digits long"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    shuburb: {
      type: String,
      default: "Malvern East",
    },
    postal_code: {
      type: Number,
      required: [true, "Postal code is required"],
    },
    is_locked: {
      type: Boolean,
      default: false,
    },
    temp_code: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

schema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

schema.methods.getJWTToken = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model("User", schema);
