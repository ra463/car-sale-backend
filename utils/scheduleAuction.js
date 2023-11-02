const Auction = require("../models/Auction");
const Car = require("../models/Car");
const cron = require("node-cron");

// function to update status of auction to active
const updateStatus = async (res, req) => {
  try {
    const currentTime = new Date();
    console.log(currentTime);
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
const updateStatusToClosed = async (res, req) => {
  try {
    const currentTime = new Date();
    const auctions = await Auction.find({
      status: "active",
      auction_end: { $lte: currentTime },
    });

    auctions.forEach(async (auction) => {
      auction.status = "closed";
      await auction.save();
    });

    // find the auctin which is closed and and car is true in isActionncreated
    // const closedAuctions = await Auction.find({
    //   status: "closed",
    // }).populate("car");

    // closedAuctions.forEach(async (auction) => {
    //   auction.car.isAuction_created = false;
    //   await auction.car.save();
    // });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// schedule auction status update every minute
cron.schedule("* * * * *", () => {
  updateStatus();
  updateStatusToClosed();
});
