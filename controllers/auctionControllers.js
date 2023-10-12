const Auction = require("../models/Auction");
const Car = require("../models/Car");
const User = require("../models/User");

exports.createAuction = async (req, res) => {
  try {
    const {
      auction_start_date,
      auction_start_time,
      auction_end_date,
      auction_end_time,
      current_price,
    } = req.body;
    if (!auction_start_date || !auction_end_date || !current_price)
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    const auction = await Auction.create({
      car,
      seller: req.userId,
      auction_start_date,
      auction_start_time,
      auction_end_date,
      auction_end_time,
      current_price,
    });

    user.auctions.unshift(auction._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Auction created successfully",
      auction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuctionDetails = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.auctionId)
      .populate("car", "-seller")
      .populate("seller", "name email phoneNumber profilePicUrl");

    if (!auction) return res.status(404).json({ message: "Auction not found" });

    res.status(200).json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({})
      .populate("car", "-seller")
      .populate("seller", "name profilePicUrl");

    res.status(200).json({ success: true, auctions });
  } catch (error) {}
};

// start date and time / end date and time are comming in the local time zone and format 
// for eg - date - 2021-08-20