const app = require("./app");
const { connectDB } = require("./config/database");

connectDB();

// schedule auction status update every minute
require("./utils/scheduleAuction");
// require("./utils/scheduleRefund");

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});