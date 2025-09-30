const nodemailer = require("nodemailer");
const twilio = require('twilio');
require("dotenv").config();
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL, 
        pass: process.env.PASSWORD, 
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(" Email sent: ", info.response);
    return true;
  } catch (error) {
    console.error(" Email sending error:", error);
    return false;
  }
};


const sendSms = async (to, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, 
      to: to,
    });
    console.log("SMS sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    return false;
  }
};


module.exports = {
  sendEmail,
  sendSms

};
