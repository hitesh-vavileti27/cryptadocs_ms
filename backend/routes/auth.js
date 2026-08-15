const express = require('express');
const router = express.Router();
const sendVerificationCode = require('../../client/utils/sendEmail');

// Endpoint triggered when user requests a password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // 1. Generate a 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. (Optional) Save this code to your database/session with an expiry time

  // 3. Send the email
  try {
    await sendVerificationCode(email, code);
    res.status(200).json({ success: true, message: 'Code dispatched successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

module.exports = router;