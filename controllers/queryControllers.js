const Query = require("../models/Query");
const APIFeatures = require("../utils/apiFeatures");

exports.submitQuery = async (req, res) => {
  try {
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
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorField = Object.keys(error.errors)[0];
      const errorMessage = error.errors[firstErrorField].message;
      return res.status(400).json({ message: errorMessage });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllQueries = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSingleQuery = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    res.status(200).json({
      success: true,
      query,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteQuery = async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Query deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
