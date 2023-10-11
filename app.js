const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// import Routes
const userRoutes = require("./routes/userRoutes");
const carRoutes = require("./routes/carRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const biddingRoutes = require("./routes/biddingRoutes");

// use Routes
app.use("/api/user", userRoutes);
app.use("/api/car", carRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/bidding", biddingRoutes);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

module.exports = app;
