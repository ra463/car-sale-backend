const Auction = require("../models/Auction");
const Car = require("../models/Car");
const cron = require("node-cron");

// function to update status of auction to active
const updateStatus = async (req, res) => {
  try {
    let currentTime = new Date();

    // add +5:30 to currentTime and then compare
    currentTime.setHours(currentTime.getHours() + 5);
    currentTime.setMinutes(currentTime.getMinutes() + 30);

    const auctions = await Auction.find({
      status: "inactive",
      auction_start: { $lte: currentTime },
    });

    auctions.forEach(async (auction) => {
      auction.status = "active";
      await auction.save();
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// function to update status of auction to closed
const updateStatusToClosed = async (req, res) => {
  try {
    let currentTime = new Date();

    // add +5:30 to currentTime and then compare
    currentTime.setHours(currentTime.getHours() + 5);
    currentTime.setMinutes(currentTime.getMinutes() + 30);

    const auctions = await Auction.find({
      status: "active",
      auction_end: { $lte: currentTime },
    });

    auctions.forEach(async (auction) => {
      auction.status = "closed";
      await auction.save();
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// function to update isAuction_created of car to false
const updateCar = async (req, res) => {
  try {
    const closedAuctions = await Auction.find({
      status: "closed",
    });

    for (const auction of closedAuctions) {
      const car = await Car.findById(auction.car).select("isAuction_created");
      car.isAuction_created = false;
      await car.save();
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// schedule auction status update every minute
cron.schedule("* * * * *", () => {
  updateStatus();
  updateStatusToClosed();
  // updateCar();
});

// schedule auction status update every hour
// cron.schedule("0 * * * *", () => {
//   updateCar();
// });
