const axios = require("axios");
const qs = require("qs");
const dotenv = require("dotenv");
dotenv.config();

const { CLIENT_ID, APP_SECRET } = process.env;

const base = "https://api-m.sandbox.paypal.com";

// generate access token
const generateAccessToken = async () => {
  const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");
  const url = `${base}/v1/oauth2/token`;
  const axiosInfo = { grant_type: "client_credentials" };
  try {
    const { data } = await axios.post(url, qs.stringify(axiosInfo), {
      headers: { Authorization: `Basic ${auth}` },
    });

    return data.access_token;
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = generateAccessToken;
