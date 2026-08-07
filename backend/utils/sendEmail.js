const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_EMAIL;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn(`[Nodemailer Warning] SMTP environment variables not configured. Skipping live email send to: ${to}`);
      return {
        success: false,
        delivered: false,
        message: 'SMTP credentials missing in environment variables. Email logged to console.'
      };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'DATAVERSE Symposium'}" <${process.env.FROM_EMAIL || smtpUser}>`,
      to,
      subject,
      text,
      html
    });

    console.log(`[Nodemailer Success] Email delivered to ${to} (MessageID: ${info.messageId})`);
    return { success: true, delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Nodemailer Error] Failed to send email to ${to}:`, error.message);
    return { success: false, delivered: false, error: error.message };
  }
};

module.exports = sendEmail;
