const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Define email options
  const mailOptions = {
    from: 'MediConnect <support@mediconnect.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html: options.html (if you want HTML emails)
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;