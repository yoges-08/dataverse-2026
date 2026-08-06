const nodemailer = require('nodemailer');

const isSmtpConfigured = () =>
  !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  if (isSmtpConfigured()) {
    try {
      const info = await getTransporter().sendMail({
        from: `"DATAVERSE 2026 - AAMEC" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });
      console.log(`📧 Email DELIVERED to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // No SMTP configured: send through Ethereal (nodemailer test inbox) so emails are
  // genuinely transmitted and openable via the printed preview URL.
  try {
    const account = await nodemailer.createTestAccount();
    const demoTransporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
    const info = await demoTransporter.sendMail({
      from: '"DATAVERSE 2026 - AAMEC" <no-reply@dataverse.aamec.in>',
      to,
      subject,
      html
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 [DEMO SENT] To: ${to} | Subject: ${subject}`);
    console.log(`📧 [OPEN EMAIL HERE] ${previewUrl}`);
    return { success: true, devMode: true, previewUrl };
  } catch (error) {
    console.log(`[DEV MODE] No SMTP & Ethereal unreachable -> email only logged. To: ${to} | Subject: ${subject}`);
    console.log(`[DEV MODE] Preview:\n${html}`);
    return { success: true, devMode: true };
  }
};

const qrImgHtml = (qrValue) =>
  qrValue
    ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=ffffff&color=312e81&data=${encodeURIComponent(qrValue)}" alt="DATAVERSE QR Ticket" width="240" height="240" style="display:block;margin:0 auto;border-radius:12px;padding:8px;background:#fff;"/>`
    : '';

const mailShell = (innerHtml) => `
  <div style="margin:0;padding:0;background:#090d16;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;background:linear-gradient(160deg,#1e1b4b 0%,#090d16 100%);border:1px solid rgba(139,92,246,0.35);border-radius:18px;">
      <div style="text-align:center;padding-bottom:16px;border-bottom:1px dashed rgba(139,92,246,0.4);">
        <div style="font-size:26px;font-weight:900;letter-spacing:2px;">
          <span style="color:#818cf8;">DATA</span><span style="color:#a78bfa;">VERSE</span>
          <span style="color:#ec4899;font-size:14px;"> 2026</span>
        </div>
        <div style="color:#94a3b8;font-size:12px;margin-top:6px;">Anjalai Ammal Mahalingam Engineering College, Kovilvenni</div>
        <div style="color:#c4b5fd;font-size:11px;margin-top:2px;letter-spacing:1px;">Innovate • Inspire • Create</div>
      </div>
      ${innerHtml}
      <div style="text-align:center;color:#64748b;font-size:11px;padding-top:16px;border-top:1px dashed rgba(139,92,246,0.3);margin-top:20px;">
        For any queries contact symposium desk • AAMEC Kovilvenni • Tamil Nadu
      </div>
    </div>
  </div>
`;

const sendRegistrationMail = async ({ to, name, registerNumber, symposiumCode, qrCodeData }) => {
  const html = mailShell(`
    <div style="padding:20px 8px 4px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">Welcome, ${name}! 🎉</h2>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">
        Your registration for <strong style="color:#ffffff;">DATAVERSE 2026</strong> is confirmed.
        This email contains your unique Symposium Code and QR Ticket.
      </p>

      <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.4);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <div style="color:#e0e7ff;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Your Symposium Code</div>
        <div style="color:#a5b4fc;font-size:22px;font-weight:800;letter-spacing:2px;">${symposiumCode}</div>
        ${registerNumber ? `<div style="color:#94a3b8;font-size:12px;margin-top:4px;">Register No: ${registerNumber}</div>` : ''}
      </div>

      <div style="text-align:center;margin-bottom:18px;">
        <div style="color:#e0e7ff;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Your QR Ticket</div>
        ${qrImgHtml(symposiumCode)}
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        Show this QR at the on-site check-in desk to collect your badge and entry.
        Your registration status is <strong style="color:#fbbf24;">Pending</strong> until verified by the symposium admin.
      </p>
    </div>
  `);
  return sendMail({ to, subject: 'DATAVERSE 2026 - Registration Confirmation & QR Ticket', html });
};

const sendApprovalMail = async ({ to, name, registerNumber, symposiumCode, qrCodeData }) => {
  const html = mailShell(`
    <div style="padding:20px 8px 4px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">Registration Approved ✅ ${name}</h2>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">
        Great news! Your registration for <strong style="color:#ffffff;">DATAVERSE 2026</strong> has been
        <strong style="color:#34d399;">Approved</strong>. You can now use your QR ticket for on-site check-in.
      </p>

      <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.4);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <div style="color:#d1fae5;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Your Symposium Code</div>
        <div style="color:#6ee7b7;font-size:22px;font-weight:800;letter-spacing:2px;">${symposiumCode}</div>
        ${registerNumber ? `<div style="color:#94a3b8;font-size:12px;margin-top:4px;">Register No: ${registerNumber}</div>` : ''}
      </div>

      <div style="text-align:center;margin-bottom:18px;">
        <div style="color:#e0e7ff;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Your QR Ticket</div>
        ${qrImgHtml(symposiumCode)}
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        Meet us at <strong style="color:#ffffff;">Anjalai Ammal Mahalingam Engineering College, Kovilvenni</strong>.
        Present this email's QR at the entrance to check in. See you at DATAVERSE!
      </p>
    </div>
  `);
  return sendMail({ to, subject: 'DATAVERSE 2026 - Your Registration is Approved!', html });
};

const sendEventRegistrationMail = async ({ to, name, eventTitle, eventVenue, eventDate, eventTime }) => {
  const html = mailShell(`
    <div style="padding:20px 8px 4px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">You're registered for an event! 🎟️ ${name}</h2>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">
        Your booking for <strong style="color:#ffffff;">${eventTitle}</strong> at
        <strong style="color:#ffffff;">DATAVERSE 2026</strong> is confirmed.
      </p>

      <div style="background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.4);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <div style="color:#ede9fe;font-size:12px;line-height:1.7;">
          <div><span style="color:#a78bfa;">Event:</span> <span style="color:#ffffff;font-weight:700;">${eventTitle}</span></div>
          ${eventVenue ? `<div><span style="color:#a78bfa;">Venue:</span> ${eventVenue}</div>` : ''}
          ${eventDate ? `<div><span style="color:#a78bfa;">Date:</span> ${eventDate}</div>` : ''}
          ${eventTime ? `<div><span style="color:#a78bfa;">Time:</span> ${eventTime}</div>` : ''}
        </div>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        Carry your symposium QR ticket to the venue. You can see all your bookings from your
        <strong style="color:#ffffff;">student dashboard</strong> after logging in.
      </p>
    </div>
  `);
  return sendMail({ to, subject: `DATAVERSE 2026 - Registered for ${eventTitle}`, html });
};

const sendLoginMail = async ({ to, name }) => {
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = mailShell(`
    <div style="padding:20px 8px 4px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">Sign-In Alert 🔐 ${name}</h2>
      <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 16px;">
        A new sign-in to your <strong style="color:#ffffff;">DATAVERSE 2026</strong> student account was just detected.
      </p>

      <div style="background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.4);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <div style="color:#cffafe;font-size:12px;line-height:1.7;">
          <div><span style="color:#22d3ee;">Signed in at:</span> ${now}</div>
          <div><span style="color:#22d3ee;">Account:</span> ${to}</div>
        </div>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        If this was you, no action is needed. <strong style="color:#fbbf24;">If you didn't do this</strong>, reset your
        password immediately or contact the symposium help desk.
      </p>
    </div>
  `);
  return sendMail({ to, subject: 'DATAVERSE 2026 - New Sign-in Alert', html });
};
module.exports = { sendMail, sendRegistrationMail, sendApprovalMail, sendEventRegistrationMail, sendLoginMail, isSmtpConfigured };
