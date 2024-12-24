const mongoose = require("mongoose")
// const mailSender = require("../util/mailSender");
const { templates, sendMail } = require("../services/Email/email.service");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 10, 
  },
});


async function sendVerificationEmail(email, otp) {
  try {
    const emailContent = templates.otp({ otp }); 
    const mailResponse = await sendMail(email, "Verification Email", emailContent);

    if (!mailResponse.success) {
      console.error("Error sending email:", mailResponse.error);
      throw new Error("Failed to send OTP email. Please try again later.");
    }
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}
otpSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Send OTP verification email
      await sendVerificationEmail(this.email, this.otp);
      
    } catch (error) {
      console.error("Error processing OTP:", error);
      next(error);
    }
  } 
  next();
});

module.exports.otpCollection = mongoose.model('otp', otpSchema);