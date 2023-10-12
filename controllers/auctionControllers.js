const Auction = require("../models/Auction");
const Car = require("../models/Car");
const User = require("../models/User");
const { parse, format } = require("date-fns");

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

    const auction_start = `${auction_start_date} ${auction_start_time}`;
    const auction_end = `${auction_end_date} ${auction_end_time}`;

    const parsedDateTime_start = parse(
      auction_start,
      "MM/dd/yyyy h:mm a",
      new Date()
    );
    const parsedDateTime_end = parse(
      auction_end,
      "MM/dd/yyyy h:mm a",
      new Date()
    );
    let utcFormat_start = format(
      parsedDateTime_start,
      "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      { timeZone: "UTC" }
    );
    let utcFormat_end = format(
      parsedDateTime_end,
      "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
      { timeZone: "UTC" }
    );

    utcFormat_start = utcFormat_start.split("+")[0] + "Z";
    utcFormat_end = utcFormat_end.split("+")[0] + "Z";

    const auction = await Auction.create({
      car,
      seller: req.userId,
      auction_start: new Date(utcFormat_start),
      auction_end: new Date(utcFormat_end),
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
