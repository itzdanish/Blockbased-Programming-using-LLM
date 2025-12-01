const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Read configuration:
// Set via `firebase functions:config:set otp.key="SOME_KEY" mail.user="you@gmail.com" mail.pass="APP_PASSWORD"`
const OTP_KEY = functions.config().otp && functions.config().otp.key;
const MAIL_USER = functions.config().mail && functions.config().mail.user;
const MAIL_PASS = functions.config().mail && functions.config().mail.pass;

if (!MAIL_USER || !MAIL_PASS) {
  console.warn('Mail credentials are not configured. Use firebase functions:config:set mail.user and mail.pass');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS
  }
});

exports.sendOtpEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Only POST allowed' });
      }

      const apiKey = req.get('x-api-key') || req.headers['x-api-key'];
      if (!OTP_KEY || apiKey !== OTP_KEY) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
      }

      const { email, otp } = req.body || {};
      if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Missing email or otp' });
      }

      const mailOptions = {
        from: `Blockly LMS <${MAIL_USER}>`,
        to: email,
        subject: 'Your Blockly signup OTP',
        html: `<p>Hi,</p>
               <p>Your Blockly signup OTP is: <strong>${otp}</strong></p>
               <p>This code expires in 5 minutes.</p>`
      };

      await transporter.sendMail(mailOptions);
      return res.json({ success: true });
    } catch (err) {
      console.error('Error sending OTP email', err);
      return res.status(500).json({ success: false, error: String(err) });
    }
  });
});
