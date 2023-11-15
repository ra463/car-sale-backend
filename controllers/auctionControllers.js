const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
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
      seller_type,
      company_name,
      current_price,
      abn,
    } = req.body;

    if (
      !auction_start_date ||
      !auction_end_date ||
      !current_price ||
      !seller_type ||
      !auction_start_time ||
      !auction_end_time
    )
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.isAuction_created === true) {
      return res
        .status(400)
        .json({ message: "Auction already created for this car" });
    }

    const auction_start_time_12hrs = format(
      parse(auction_start_time, "HH:mm", new Date()),
      "h:mm a"
    );

    const auction_end_time_12hrs = format(
      parse(auction_end_time, "HH:mm", new Date()),
      "h:mm a"
    );

    const auction_start = `${auction_start_date} ${auction_start_time_12hrs}`;
    const auction_end = `${auction_end_date} ${auction_end_time_12hrs}`;

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

    if (seller_type === "company") {
      if (!company_name || !abn) {
        return res
          .status(400)
          .json({ message: "Company name and ABN is required" });
      }
    }

    const auction = await Auction.create({
      car: car._id,
      seller: req.userId,
      auction_start: new Date(utcFormat_start),
      auction_end: new Date(utcFormat_end),
      seller_type,
      company_name,
      current_price,
      abn,
    });

    car.isAuction_created = true;
    await car.save();

    res.status(201).json({
      success: true,
      message: "Auction created successfully",
      auction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAuctions = async (req, res) => {
  try {
    const auctionCount = await Auction.countDocuments();

    let query = Auction.find()
      .sort({ createdAt: -1 })
      .populate(
        "car",
        "model manufacture_year manufacture_company unique_identification_number fuel_type description odometer_reading drive_type images color transmission_type"
      )
      .populate("highest_bid", "bid_amount bidder");

    if (Object.keys(req.query).length > 0) {
      const aggregation = Auction.aggregate();

      aggregation
        .lookup({
          from: "cars",
          localField: "car",
          foreignField: "_id",
          as: "carsInf",
        })
        .unwind("$carsInf");

      const matchFilter = {
        $match: {
          // "carsInf.manufacture_year": {
          //   $type: "number",
          //   $eq: parseInt(req.query.manufacture_year),
          // },
          "carsInf.model": {
            $regex: new RegExp(req.query.model, "i"),
          },
          "carsInf.manufacture_company": {
            $regex: new RegExp(req.query.manufacture_company, "i"),
          },
          "carsInf.fuel_type": {
            $regex: new RegExp(req.query.fuel_type, "i"),
          },
          "carsInf.drive_type": {
            $regex: new RegExp(req.query.drive_type, "i"),
          },
          "carsInf.transmission_type": {
            $regex: new RegExp(req.query.transmission_type, "i"),
          },
        },
      };

      if (req.query.manufacture_year) {
        matchFilter.$match["carsInf.manufacture_year"] = {
          $type: "number",
          $eq: parseInt(req.query.manufacture_year),
        };
      }

      // console.log("Debug: matchFilter", JSON.stringify(matchFilter, null, 2));
      aggregation.append(matchFilter);

      const result = await aggregation.exec();
      const auctionIds = result.map((results) => results._id);

      query = query.where("_id").in(auctionIds);
    }

    if (req.query.status) {
      query = query.where("status").equals(req.query.status);
    }

    const currentPage = Number(req.query.currentPage);
    const resultPerPage = Number(req.query.resultPerPage);

    const skip = resultPerPage * (currentPage - 1);
    query = query.limit(resultPerPage).skip(skip);

    const numOfPages = Math.ceil(auctionCount / resultPerPage);

    const auctions = await query.exec();
    const filteredAuctionsCount = auctions.length;

    res.status(200).json({
      success: true,
      auctions,
      auctionCount,
      filteredAuctionsCount,
      numOfPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAuctionDetails = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.auctionId)
      .populate("bids", "bid_amount")
      .populate("car", "-seller")
      .populate("highest_bid", "bid_amount bidder");

    if (!auction) return res.status(404).json({ message: "Auction not found" });
    if (
      auction.is_Seller_paid10_percent === true &&
      auction.is_Winner_paid10_percent === true
    ) {
      await auction.populate("seller", "name email phoneNumber");
    }

    res.status(200).json({ success: true, auction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ message: "Bid Id is required" });
    const auction = await Auction.findById(req.params.auctionId).populate(
      "highest_bid",
      "bid_amount"
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.seller.toString() !== req.userId.toString())
      return res.status(400).json({
        message: "You cannot confirm bids on this auction",
      });

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    if (bid.bid_amount === auction.highest_bid.bid_amount) {
      auction.auction_confirmed = true;
      bid.is_confirmed_bid = true;
      await bid.save();
      await auction.save();
    } else {
      return res
        .status(400)
        .json({ message: "Bid amount is not equal to the highest bid" });
    }

    res
      .status(200)
      .json({ success: true, message: "Bid Confirmed Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
