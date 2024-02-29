const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require("twilio")(accountSid, authToken);

// exports.sendOTP = async (phoneNo) => {
//   return await client.verify.v2
//     .services(process.env.SERVICE_SID)
//     .verifications.create({ to: phoneNo, channel: "sms" });
// };

// exports.verifyOTP = async (phoneNo, code, res) => {
//   const { status, valid } = await client.verify.v2
//     .services(process.env.SERVICE_SID)
//     .verificationChecks.create({ to: phoneNo, code: code });
//   if (status === "pending" && !valid) {
//     return res.status(400).json({ message: "Invalid OTP" });
//   }
//   return valid;
// };
