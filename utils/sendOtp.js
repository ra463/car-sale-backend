// const dotenv = require("dotenv");
// dotenv.config({ path: "../config/config.env" });

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = "ACcc042797bf397019ca35ec83991563ac";
const authToken = "9c70136434e0e290cddea2473b1ebf67";
const client = require("twilio")(accountSid, authToken);

exports.sendOTP = async (phoneNo) => {
  return await client.verify.v2
    .services("VA1cc15d68e3ac269330b4af46ade9bc0d")
    .verifications.create({ to: phoneNo, channel: "sms" });
};

exports.verifyOTP = async (phoneNo, code, res) => {
  const { status, valid } = await client.verify.v2
    .services("VA1cc15d68e3ac269330b4af46ade9bc0d")
    .verificationChecks.create({ to: phoneNo, code: code });
  if (status === "pending" && !valid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }
  return valid;
};
