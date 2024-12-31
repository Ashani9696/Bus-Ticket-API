const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = process.env.EMAIL_PORT || 587;
const emailSecure = process.env.EMAIL_SECURE === 'true';

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailSecure,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const compileTemplate = (templateName, variables) => {
  const templatePath = path.join(__dirname, '..', 'views', 'templates', `${templateName}.ejs`);
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  return ejs.render(templateSource, variables);
};

const sendEmail = async (to, subject, templateName, variables) => {
  try {
    const htmlContent = compileTemplate(templateName, variables);

    const mailOptions = {
      from: emailUser,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendEmail };
