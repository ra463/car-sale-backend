const express = require("express");
const { submitQuery } = require("../controllers/queryControllers");

const router = express.Router();

router.route("/submit-query").post(submitQuery);

module.exports = router;
