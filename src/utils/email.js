const nodemailer = require("nodemailer");

const sendOtpMail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or use SMTP settings
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"OthlooSha" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your OTP for Verification",
      text: `Your OTP is ${otp}. Please use this to complete your verification.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = sendOtpMail;
