const Query = require("../models/Query");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");

exports.submitQuery = catchAsyncError(async (req, res, next) => {
  const { name, email, phone, message } = req.body;

  await Query.create({
    name,
    email,
    phone,
    message,
  });

  res.status(201).json({
    success: true,
    message: "Query submitted successfully",
  });
});

exports.getAllQueries = catchAsyncError(async (req, res, next) => {
  let query = await Query.countDocuments();

  const apiFeatures = new APIFeatures(
    Query.find().sort({ createdAt: -1 }),
    req.query
  ).search("name");

  let queries = await apiFeatures.query;

  const filteredQueriesCount = queries.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeatures.pagination();
    queries = await apiFeatures.query.clone();
  }

  res.status(200).json({
    success: true,
    queries,
    queriesCount: query,
    filteredQueriesCount,
  });
});

exports.getSingleQuery = catchAsyncError(async (req, res, next) => {
  const query = await Query.findById(req.params.id);
  if (!query) return res.status(404).json({ message: "Query not found" });

  res.status(200).json({
    success: true,
    query,
  });
});

exports.deleteQuery = catchAsyncError(async (req, res, next) => {
  await Query.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Query deleted successfully",
  });
});
