// // src/middleware/verifyRecaptcha.js
// const axios = require('axios');
// require('dotenv').config();

// async function verifyRecaptcha(req, res, next) {
//   try {
//     const { recaptchaToken } = req.body;

//     if (!recaptchaToken) {
//       return res.status(400).json({ message: 'reCAPTCHA token is required' });
//     }

//     const response = await axios.post(
//       `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`
//     );

//     if (!response.data.success) {
//       return res.status(400).json({ message: 'reCAPTCHA verification failed' });
//     }

//     next();
//   } catch (err) {
//     console.error('reCAPTCHA Error:', err);
//     return res.status(500).json({ message: 'Server error during reCAPTCHA verification' });
//   }
// }

// module.exports = verifyRecaptcha;
