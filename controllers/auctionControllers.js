const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Car = require("../models/Car");
const User = require("../models/User");
const { generateAuctionId } = require("../utils/generateClientId");
const { bidConfirmedEmail } = require("../utils/sendMail");

exports.createAuction = async (req, res) => {
  try {
    const {
      auction_start_date,
      auction_start_time,
      auction_end_date,
      auction_end_time,
      seller_type,
      company_name,
      show_hide_price,
      asking_price,
      abn,
      timezoneOffset,
    } = req.body;

    if (
      !auction_start_date ||
      !auction_end_date ||
      !asking_price ||
      !seller_type ||
      !auction_start_time ||
      !auction_end_time
    )
      return res.status(400).json({ message: "Please fill in all fields" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const car = await Car.findById(req.params.carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (user._id.toString() !== car.seller.toString()) {
      return res
        .status(400)
        .json({ message: "You are not the owner of this car" });
    }

    if (car.isAuction_created === true) {
      return res
        .status(400)
        .json({ message: "Auction already created for this car" });
    }

    const convertTo24hrs = (time) => {
      let hours = parseInt(time.split(":")[0]);
      let minutes = parseInt(time.split(":")[1].split(" ")[0]);
      let ampm = time.split(":")[1].split(" ")[1];

      if (ampm === "PM" && hours < 12) hours = hours + 12;
      if (ampm === "AM" && hours === 12) hours = hours - 12;

      hours = hours.toString().length === 1 ? "0" + hours : hours;
      minutes = minutes.toString().length === 1 ? "0" + minutes : minutes;

      return `${hours}:${minutes}`;
    };

    // convert time to 24hrs format
    const auction_start_time_24hrs = convertTo24hrs(auction_start_time);
    const auction_end_time_24hrs = convertTo24hrs(auction_end_time);

    let auction_start = `${auction_start_date} ${auction_start_time_24hrs}`;
    let auction_end = `${auction_end_date} ${auction_end_time_24hrs}`;

    if (auction_end < auction_start) {
      return res.status(400).json({
        message: "Auction end date cannot be before auction start date",
      });
    }

    // converting it into 24hrs format
    let timezoneOffsetInHours = Math.abs(timezoneOffset / 60);
    let timezoneOffsetInMinutes = Math.abs(timezoneOffset % 60);

    timezoneOffsetInHours =
      timezoneOffsetInHours.toString().length === 1
        ? "0" + timezoneOffsetInHours
        : timezoneOffsetInHours;
    timezoneOffsetInHours = Math.floor(timezoneOffsetInHours);

    timezoneOffsetInMinutes =
      timezoneOffsetInMinutes.toString().length === 1
        ? "0" + timezoneOffsetInMinutes
        : timezoneOffsetInMinutes;

    let start = new Date(auction_start);
    let end = new Date(auction_end);

    start.setHours(start.getHours() - timezoneOffsetInHours);
    start.setMinutes(start.getMinutes() - timezoneOffsetInMinutes);

    end.setHours(end.getHours() - timezoneOffsetInHours);
    end.setMinutes(end.getMinutes() - timezoneOffsetInMinutes);

    let auctionId = await generateAuctionId();

    if (seller_type === "private") {
      await Auction.create({
        auction_id: auctionId,
        car: car._id,
        seller: req.userId,
        auction_start: start,
        auction_end: end,
        seller_type,
        asking_price,
        show_hide_price,
      });
    }

    if (seller_type === "company") {
      if (!company_name || !abn) {
        return res
          .status(400)
          .json({ message: "Company name and ABN is required" });
      }
      await Auction.create({
        auction_id: auctionId,
        car: car._id,
        seller: req.userId,
        auction_start: start,
        auction_end: end,
        seller_type,
        company_name,
        asking_price,
        show_hide_price,
        abn,
      });
    }

    car.isAuction_created = true;
    await car.save();

    res.status(201).json({
      success: true,
      message: "Auction created successfully",
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
        "model manufacture_year manufacture_company unique_identification_number fuel_type description odometer_reading drive_type images color transmission_type car_state car_city car_postal_code vehicle_type"
      );

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
          "carsInf.vehicle_type": {
            $regex: new RegExp(req.query.vehicle_type, "i"),
          },
          "carsInf.model": {
            $regex: new RegExp(req.query.model, "i"),
          },
          "carsInf.car_state": {
            $regex: new RegExp(req.query.car_state, "i"),
          },
          "carsInf.manufacture_company": {
            $regex: new RegExp(req.query.manufacture_company, "i"),
          },
          // "carsInf.fuel_type": {
          //   $regex: new RegExp(req.query.fuel_type, "i"),
          // },
          // "carsInf.vehicle_type": {
          //   $regex: new RegExp(req.query.vehicle_type, "i"),
          // },
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

    auctions.forEach(async (auction) => {
      if (auction.show_hide_price === false) {
        auction.asking_price = null;
      } else {
        auction.asking_price = auction.asking_price;
      }
    });

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
    const auction = await Auction.findById(req.params.auctionId).populate(
      "car",
      "-seller"
    );
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.show_hide_price === false) {
      auction.asking_price = null;
    }

    const bids = await Bid.find({ auction: req.params.auctionId })
      .sort({
        createdAt: -1,
      })
      .select("bid_amount bidder");

    if (
      auction.is_Seller_paid10_percent === true &&
      auction.is_Winner_paid10_percent === true
    ) {
      await bids[0].populate("bidder", "name email phoneNumber");
    }

    res.status(200).json({ success: true, auction, bids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.confirmBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId) return res.status(400).json({ message: "Bid Id is required" });

    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.seller.toString() !== req.userId.toString())
      return res.status(400).json({
        message: "You cannot confirm bids on this auction",
      });

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });

    if (bid.bid_amount === auction.highest_bid) {
      auction.auction_confirmed = true;
      bid.is_confirmed_bid = true;
      await bidConfirmedEmail(
        bid.bidder.email,
        bid.bidder.name,
        auction.auction_id
      );
      await auction.save();
      await bid.save();
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

// exports.createAuction = async (req, res) => {
//   try {
//     const {
//       auction_start_date,
//       auction_start_time,
//       auction_end_date,
//       auction_end_time,
//       seller_type,
//       company_name,
//       asking_price,
//       abn,
//     } = req.body;

//     if (
//       !auction_start_date ||
//       !auction_end_date ||
//       !asking_price ||
//       !seller_type ||
//       !auction_start_time ||
//       !auction_end_time
//     )
//       return res.status(400).json({ message: "Please fill in all fields" });

//     const user = await User.findById(req.userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const car = await Car.findById(req.params.carId);
//     if (!car) return res.status(404).json({ message: "Car not found" });

//     if (car.isAuction_created === true) {
//       return res
//         .status(400)
//         .json({ message: "Auction already created for this car" });
//     }

//     const auction_start_time_12hrs = format(
//       parse(auction_start_time, "HH:mm", new Date()),
//       "h:mm a"
//     );

//     const auction_end_time_12hrs = format(
//       parse(auction_end_time, "HH:mm", new Date()),
//       "h:mm a"
//     );

//     const auction_start = `${auction_start_date} ${auction_start_time_12hrs}`;
//     const auction_end = `${auction_end_date} ${auction_end_time_12hrs}`;

//     if (new Date(auction_start) < new Date())
//       return res
//         .status(400)
//         .json({ message: "Auction start date cannot be in the past" });

//     if (new Date(auction_end) < new Date(auction_start)) {
//       return res.status(400).json({
//         message: "Auction end date cannot be before auction start date",
//       });
//     }

//     const parsedDateTime_start = parse(
//       auction_start,
//       "MM/dd/yyyy h:mm a",
//       new Date()
//     );
//     const parsedDateTime_end = parse(
//       auction_end,
//       "MM/dd/yyyy h:mm a",
//       new Date()
//     );

//     let utcFormat_start = format(
//       parsedDateTime_start,
//       "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
//       { timeZone: "UTC" }
//     );
//     let utcFormat_end = format(
//       parsedDateTime_end,
//       "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
//       { timeZone: "UTC" }
//     );

//     utcFormat_start = utcFormat_start.split("+")[0] + "Z";
//     utcFormat_end = utcFormat_end.split("+")[0] + "Z";

//     if (seller_type === "company") {
//       if (!company_name || !abn) {
//         return res
//           .status(400)
//           .json({ message: "Company name and ABN is required" });
//       }
//     }

//     const auction = await Auction.create({
//       car: car._id,
//       seller: req.userId,
//       auction_start: new Date(utcFormat_start),
//       auction_end: new Date(utcFormat_end),
//       seller_type,
//       company_name,
//       asking_price,
//       abn,
//     });

//     car.isAuction_created = true;
//     await car.save();

//     res.status(201).json({
//       success: true,
//       message: "Auction created successfully",
//       auction,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.testingDateTime = async (req, res) => {
  // let currentTime = new Date();

  // // add +5:30 to currentTime and then compare
  // currentTime.setHours(currentTime.getHours() - 7);
  // currentTime.setMinutes(currentTime.getMinutes() - 30);

  // res.status(200).json({ success: true, start: new Date(), currentTime });

  const auctions = await Auction.find().populate("car", "vehicle_type");
  // let cars = [];
  // auctions.forEach(async (auction) => {
  //   const car = await Car.findById(auction.car);
  //   console.log("Debug: car", car);
  //   // car which are not found by id just push null
  //   if (!car) cars.push(null);
  //   else cars.push(car);
  // });
  res.status(200).json({ success: true, auctions });
};
