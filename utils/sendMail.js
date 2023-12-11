const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({
  path: "../config/config.env",
});

const newUser = async (email, name) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Welcome to Car Auction",
      html: `<div
        class="container"
        style="font-family: 'Roboto', sans-serif; margin: 0 auto"
      >
        <div class="head" style="display: flex; justify-content: center">
          <h2 style="color: #f4c23d;margin: 0px 10px;padding: 10px;padding-top: 5px">
            Welcome to Car Auction
          </h2>
        </div>
        <div
          class="row"
          style="
                padding: 1rem;
                border-top: 1px solid #e5e5e5;
                border-bottom: 1px solid #e5e5e5;
              "
        >
          <div class="col-12" style="text-align: center">
            <p style="font-weight: bold; padding: 0; margin: 0">
              Hello <span style="color: #2f5e8e">${name}</span>, Welcome to Car Auction.
            </p>
            <p style="padding: 0; margin: 0">
              We are glad to have you on our platform. We hope you will have a great experience with us.
            </p>
            <p style="color: slategray;padding: 5px; margin: 0">
              If you have any query, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
            </p>
            <p
              style="
                    padding:5px;
                    padding-bottom: 0;
                    margin: 0;
                    color: #949090;
                    font-size: 0.8rem;
                  "
            >
              Regards, Team <span style="color: #35B0FC">Car Auction</span>
            </p>
            </div>
        </div>
      </div>`,
    };

    smtpTransport.sendMail(options, (err, res) => {
      if (err) return err;
      return res;
    });
  } catch (error) {
    console.log("err ", err);
  }
};

const resetPasswordCode = async (email, name, code) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Car Auction Reset Code",
      html: `<div
        class="container"
        style="font-family: 'Roboto', sans-serif; margin: 0 auto"
      >
        <div class="head" style="display: flex; justify-content: center">
          <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
            Code for Resetting Your Password
          </h2>
        </div>
        <div
          class="row"
          style="
                padding: 1rem 0;
                border-top: 1px solid #e5e5e5;
                border-bottom: 1px solid #e5e5e5;
                padding-top: 0;
              "
        >
          <div class="col-12" style="text-align: center">
            <img
              src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
              alt="img"
              style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
            />
            <p style="font-weight: bold; padding: 0; margin: 0">
              Hey ${name}, You have requested for resetting your password.
            </p>
            <p style="padding: 0; margin: 0">
              Here is your code for resetting your password. Please enter this code to reset your password:
            </p>
            <p style="font-weight: bold;font-size: 1.5rem;padding: 0; margin: 0;color: #35B0FC;">
              ${code}
            </p>
            <p style="padding: 5px; margin: 0">
              If you haven't requested this mail, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
            </p>
            <p
              style="
                    padding:5px;
                    padding-bottom: 0;
                    margin: 0;
                    color: #949090;
                    font-size: 0.8rem;
                  "
            >
              Regards, Team <span style="color: #35B0FC">Car Auction</span>
            </p>
          </div>
        </div>
      </div>`,
    };

    smtpTransport.sendMail(options, (err, res) => {
      if (err) return err;
      return res;
    });
  } catch (error) {
    console.log("err ", err);
  }
};

const sendWinnerEmail = async (email, name, auction) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Congratulations! You have won the auction.",
      html: `<div
        class="container"
        style="font-family: 'Roboto', sans-serif; margin: 0 auto"
      >
        <div class="head" style="display: flex; justify-content: center">
          <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
            Seller has accepted/Confirmed your Bid
          </h2>
        </div>
        <div
          class="row"
          style="
                padding: 1rem 0;
                border-top: 1px solid #e5e5e5;
                border-bottom: 1px solid #e5e5e5;
                padding-top: 0;
              "
        >
          <div class="col-12" style="text-align: center">
            <img
              src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
              alt="img"
              style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
            />
            <p style="font-weight: bold; padding: 0; margin: 0">
              Hey ${name}, Congratulations! You won the Auction.
            </p>
            <p style="padding: 0; margin: 0">
              Please visit your account and pay 10% of your Bidding.
            </p>
            <p style="padding: 5px; margin: 0">
              If you have any query, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.

            </p>
            <p
              style="
                    padding:5px;
                    padding-bottom: 0;
                    margin: 0;
                    color: #949090;
                    font-size: 0.8rem;
                  "
            >
              Regards, Team <span style="color: #35B0FC">Car Auction</span>
            </p>
          </div>
        </div>
      </div>`,
    };

    smtpTransport.sendMail(options, (err, res) => {
      if (err) return err;
      return res;
    });
  } catch (error) {
    console.log("err ", err);
  }
};

const bidConfirmedEmail = async (email, name, auction) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Congratulations! Your Bid has been confirmed",
      html: `<div
        class="container"
        style="font-family: 'Roboto', sans-serif; margin: 0 auto"
      >
        <div class="head" style="display: flex; justify-content: center">
          <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
            Seller has accepted/Confirmed your Bid
          </h2>
        </div>
        <div
          class="row"
          style="
                padding: 1rem 0;
                border-top: 1px solid #e5e5e5;
                border-bottom: 1px solid #e5e5e5;
                padding-top: 0;
              "
        >
          <div class="col-12" style="text-align: center">
            <img
              src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
              alt="img"
              style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
            />
            <p style="font-weight: bold; padding: 0; margin: 0">
              Hey ${name}, Congratulations! Your Bid has been accepted for the auctionId: <b>#${auction}</b>.
            </p>
            <p style="padding: 0; margin: 0">
              Please visit your account and pay 10% of your Bidding.
            </p>
            <p style="padding: 5px; margin: 0">
              If you have any query, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
            </p>
            <p
              style="
                    padding:5px;
                    padding-bottom: 0;
                    margin: 0;
                    color: #949090;
                    font-size: 0.8rem;
                  "
            >

              Regards, Team <span style="color: #35B0FC">Car Auction</span>
            </p>
          </div>
        </div>
      </div>`,
    };

    smtpTransport.sendMail(options, (err, res) => {
      if (err) return err;
      return res;
    });
  } catch (error) {
    console.log("err ", err);
  }
};

const confirmationPaymentEmail = async (email, name, auctionId, amount) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "You Recently Paid for the Auction",
      html: `<div
        class="container"
        style="font-family: 'Roboto', sans-serif; margin: 0 auto"
      >
        <div class="head" style="display: flex; justify-content: center">
          <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
            You Recently Paid for the AuctionId #${auctionId}
          </h2>
        </div>
        <div
          class="row"
          style="
                padding: 1rem 0;
                border-top: 1px solid #e5e5e5;
                border-bottom: 1px solid #e5e5e5;
                padding-top: 0;
              "
        >
          <div class="col-12" style="text-align: center">
            <img
              src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
              alt="img"
              style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
            />
            <p style="font-weight: bold; padding: 0; margin: 0">
              Hey ${name}, We have recently received your payment of <b>${amount} AUD</b> for the auctionId: <b>#${auctionId}</b>.
              <br></br>
              Hang on, we are processing your payment. We will notify you once your payment is completed successfully. <b>Please wait for the confirmation email.</b> It may take some time to process your payment like 1-2 hours.
            </p>
            <p style="padding: 5px; margin: 0">
              If you have any query, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
            </p>
            <p
              style="
                    padding:5px;
                    padding-bottom: 0;
                    margin: 0;
                    color: #949090;
                    font-size: 0.8rem;
                  "
            >

              Regards, Team <span style="color: #35B0FC">Car Auction</span>
            </p>
          </div>
        </div>
      </div>`,
    };

    smtpTransport.sendMail(options, (err, res) => {
      if (err) return err;
      return res;
    });
  } catch (error) {
    console.log("err ", err);
  }
};

const paymentDone = async (email, name, auctionId, transactionId, amount) => {
  try {
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const options = {
      from: process.env.EMAIL,
      to: email,
      subject: "Payment Done Successfully",
      html: `<div
        class="container"
        style="font-family: 'Roboto', sans-serif; margin: 0 auto"
      >
        <div class="head" style="display: flex; justify-content: center">
          <h2 style="margin: 0px 10px;padding: 10px;padding-top: 5px">
            Your Payment has been done successfully
          </h2>
        </div>
        <div
          class="row"
          style="
                padding: 1rem 0;
                border-top: 1px solid #e5e5e5;
                border-bottom: 1px solid #e5e5e5;
                padding-top: 0;
              "
        >
          <div class="col-12" style="text-align: center">
            <img
              src="https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ="
              alt="img"
              style="width: 200px;box-shadow: rgba(0, 0, 0, 0.16) 0px 1px 4px;margin: 5px"
            />
            <p style="font-weight: bold; padding: 0; margin: 0">
              Hey ${name}, You have Successfully paid the amount of <b>${amount} AUD</b> for the auctionId: <b>#${auctionId}</b>.
              <br></br>
              Your Transaction Id is: <b>#${transactionId}</b>.
            </p>
            <p style="padding: 5px; margin: 0">
              If you have any query, then please contact us on our helpline number <span style="font-weight: bold">+91-1234567890</span>.
            </p>
            <p
              style="
                    padding:5px;
                    padding-bottom: 0;
                    margin: 0;
                    color: #949090;
                    font-size: 0.8rem;
                  "
            >

              Regards, Team <span style="color: #35B0FC">Car Auction</span>
            </p>
          </div>
        </div>
      </div>`,
    };

    smtpTransport.sendMail(options, (err, res) => {
      if (err) return err;
      return res;
    });
  } catch (error) {
    console.log("err ", err);
  }
};

module.exports = {
  newUser,
  resetPasswordCode,
  sendWinnerEmail,
  bidConfirmedEmail,
  confirmationPaymentEmail,
  paymentDone,
};
