const mongoose = require("mongoose");

exports.connectDB = async () => {
  mongoose.set("strictQuery", false);
  const { connection } = await mongoose.connect(process.env.MONGO_URI);

  console.log(`MongoDB connected: ${connection.host}`);
};
