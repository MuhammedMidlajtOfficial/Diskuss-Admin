const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return { success: true, response: info.response };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: err.message };
  }
};

const templates = {
  welcome: ({ userName, email, password, phoneNumber, category, imageUrl }) => `
    <h1>Welcome, ${userName}!</h1>
    <p>We're excited to have you on board. Here are your details:</p>
    <ul>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Password:</strong> ${password}</li>
      <li><strong>Phone Number:</strong> ${phoneNumber}</li>
      <li><strong>Category:</strong> ${category}</li>
      <li><strong>Profile Image:</strong> <a href="${imageUrl}">View Image</a></li>
    </ul>
    <p>Keep this information safe and feel free to contact us if you have any questions.</p>
  `,
  otp: ({ otp }) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #333; text-align: center;">Connect - Verification Email</h2>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="color: #007bff;">Please confirm your OTP</h1>
            <p style="font-size: 18px; color: #555;">Here is your OTP code: ${otp}</p>
        </div>
        <p>Please use it within the next 5 minutes.</p>
    </div>
  `,
};

module.exports = {
  sendMail,
  templates,
};
