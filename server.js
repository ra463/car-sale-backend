const app = require("./app");
const { connectDB } = require("./config/database");

connectDB();

// schedule auction status update every minute
require("./utils/scheduleAuction");

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "https://asisauctions.com.au",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // console.log(`⚡: ${socket.id} user just connected!`);
  socket.on("bidreceived", async (data) => {
    try {
      io.to(data.bid.auction).emit("bidemitted", data);
    } catch (error) {
      console.log(error);
      io.to(socket.id).emit("error", error);
    }
  });
});
