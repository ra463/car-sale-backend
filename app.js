const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const errorMiddleware = require("./middlewares/error");
const bodyParser = require("body-parser");
const app = express();

dotenv.config({
  path: "./config/config.env",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: "https://master.dj66u4td9cfto.amplifyapp.com",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// import Routes
const userRoutes = require("./routes/userRoutes");
const carRoutes = require("./routes/carRoutes");
const auctionRoutes = require("./routes/auctionRoutes");
const biddingRoutes = require("./routes/biddingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const queryRoutes = require("./routes/queryRoutes");

// use Routes
app.use("/api/user", userRoutes);
app.use("/api/car", carRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/bidding", biddingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/query", queryRoutes);

app.get("/", (req, res) =>
  res.send(`<h1>Its working. Click to visit Link.</h1>`)
);

app.use(errorMiddleware);

module.exports = app;
