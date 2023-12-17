const Transaction = require("../models/Transaction");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllTransactions = async (req, res) => {
  try {
    let query = {};
    if (req.query.status !== "all") query.status = req.query.status;
    const transactionCount = await Transaction.countDocuments();

    const apiFeatures = new APIFeatures(
      Transaction.find(query).populate("user", "name").sort({ createdAt: -1 }),
      req.query
    ).search("transactionId");

    let transactions = await apiFeatures.query;

    let filteredTransactionsCount = transactions.length;
    if (req.query.resultPerPage && req.query.currentPage) {
      apiFeatures.pagination();
      transactions = await apiFeatures.query.clone();
    }

    res.status(200).json({
      status: "success",
      transactions,
      transactionCount,
      filteredTransactionsCount,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getSingleTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("user", "name")
      .populate("order")
      .populate({
        path: "order",
        select: "auction paypalOrderId createdAt updatedAt",
        populate: {
          path: "auction",
          model: "Auction",
          select:
            "car auction_id seller is_Seller_paid10_percent is_Winner_paid10_percent",
          populate: [
            {
              path: "car",
              model: "Car",
              select:
                "manufacture_company model manufacture_year unique_identification_number car_address car_city car_state car_shuburb car_postal_code",
            },
            {
              path: "seller",
              model: "User",
              select: "name",
            },
          ],
        },
      });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      status: "success",
      transaction,
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
