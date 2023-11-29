const cron = require("node-cron");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const generateAccessToken = require("../utils/paypal");
const Auction = require("../models/Auction");

const base = "https://api-m.sandbox.paypal.com";

const refundPayment = async (req, res) => {
  try {
    const currentTime = new Date();
    const auctions = await Auction.find({
      auction_confirmed: true,
      $or: [{ status: "closed" }, { status: "active" }],
      $or: [
        { is_Seller_paid10_percent: true },
        { is_Winner_paid10_percent: true },
      ],
    });

    auctions.forEach(async (auction) => {
      const order = await Order.findOne({ auction: auction._id });
      const transaction = await Transaction.findOne({ order: order._id });
      // console.log("transaction", transaction.transactionId);

      // check if transaction createdAt is more or equal to 51 hours
      const diff = Math.abs(currentTime - transaction.createdAt);
      const hours = Math.floor(diff / 1000 / 60 / 60);

      if (hours > 51) {
        const accessToken = await generateAccessToken();
        const url = `${base}/v2/payments/captures/${transaction.transactionId}/refund`;
        const { data } = await axios.post(
          url,
          {
            amount: {
              value: transaction.amount.toFixed(2),
              currency_code: "AUD",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (data.status === "COMPLETED") {
          auction.status = "refunded";
          auction.is_Seller_paid10_percent = false;
          auction.is_Winner_paid10_percent = false;
          await auction.save();
          // function to send email to seller and winner will be called here
        }
      } else {
        console.log("more than 51 hours");
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// schedule auction status update every hour
cron.schedule("0 * * * *", refundPayment);

// schedule auction status update every day i.e. 24 hours
// cron.schedule("0 0 * * *", refundPayment);