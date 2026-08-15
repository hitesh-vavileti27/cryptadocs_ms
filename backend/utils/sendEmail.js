const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail or SMTP username
      pass: process.env.EMAIL_PASS, // Your Gmail App Password
    },
  });

  // Mail options
  const mailOptions = {
    from: `"CryptaDocs Security" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.htmlMessage || `<p>${options.message}</p>`,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;