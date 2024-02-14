const Transaction = require("../models/Transaction");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllTransactions = catchAsyncError(async (req, res, next) => {
  let query = {};
  if (req.query.status !== "all") query.status = req.query.status;
  const transactionCount = await Transaction.countDocuments();

  const apiFeatures = new APIFeatures(
    Transaction.find(query)
      .populate("user", "firstname middlename lastname")
      .sort({ createdAt: -1 }),
    req.query
  ).search("transactionId");

  let transactions = await apiFeatures.query;

  let filteredTransactionsCount = transactions.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeatures.pagination();
    transactions = await apiFeatures.query.clone();
  }

  res.status(200).json({
    success: true,
    transactions,
    transactionCount,
    filteredTransactionsCount,
  });
});

exports.getSingleTransaction = catchAsyncError(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate("user", "firstname middlename lastname")
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
            select: "firstname middlename lastname",
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
    success: true,
    transaction,
  });
});
