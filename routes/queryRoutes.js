const express = require("express");
const { submitQuery } = require("../controllers/queryControllers");
const multer = require("multer");

const upload = multer();

const router = express.Router();

router.route("/submit-query").post(upload.none(), submitQuery);

module.exports = router;
