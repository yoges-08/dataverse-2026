const { sendMail } = require('./mailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const result = await sendMail({ to, subject, html: html || text });
    return {
      success: !!(result && result.success),
      delivered: !!(result && result.success),
      messageId: result && result.messageId,
      message: result && result.message,
      previewUrl: result && result.previewUrl
    };
  } catch (error) {
    console.error(`[sendEmail Error] Failed to send email to ${to}:`, error.message);
    return { success: false, delivered: false, error: error.message };
  }
};

module.exports = sendEmail;