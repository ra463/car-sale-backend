// one click service for driving license (Australia)
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config({
  path: "../config/config.env",
});

const generateDrivingToken = async () => {
  try {
    const url = "https://api.oneclickservices.com.au/api/v1/token";
    const headers = {
      Accept: "application/json",
      "Client-Secret": `${process.env.CLIENT_DRIVING_SECRET}`,
      Authorization: `Bearer ${process.env.APP_DRIVING_KEY}`,
    };

    const response = await axios.post(url, null, { headers });
    return response.token;
  } catch (error) {
    console.log(error);
  }
};

module.exports = generateDrivingToken;
