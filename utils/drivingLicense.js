// one click service for driving license (Australia)
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({
  path: "../config/config.env",
});

const { CLIENT_DRIVING_SECRET, APP_DRIVING_KEY } = process.env;

const generateDrivingToken = async () => {
  try {
    const { data } = await axios.post(
      "https://api.oneclickservices.com.au/api/v1/token",
      {},
      {
        headers: {
          Accept: "application/json",
          "Client-Secret": CLIENT_DRIVING_SECRET,
          Authorization: `Bearer ${APP_DRIVING_KEY}`,
        },
      }
    );
    return data.token;
  } catch (error) {
    console.log(error);
  }
};

module.exports = generateDrivingToken;
