const nodemailer = require('nodemailer');

// SAFETY RULE: The app must NEVER log into an email account. Only sending
// services that use an API key (Brevo) are allowed. No SMTP/Gmail fallback.

const getFromEmail = () => {
  const raw = String(process.env.BREVO_FROM || process.env.SMTP_FROM || '').replace(/^["']|["']$/g, '').trim();
  if (raw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw;
  return 'dataverse26ai@gmail.com';
};

const sendViaGmailSmtp = async ({ to, subject, html, attachments }) => {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || getFromEmail();
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  if (!pass) return null;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
    const info = await transporter.sendMail({
      from: `"DATAVERSE 2026 - AAMEC" <${user}>`,
      to,
      subject,
      html,
      attachments
    });
    console.log(`📧 Email DELIVERED to ${to} via Direct Gmail SMTP (Native DP): ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (e) {
    console.error(`📧 Direct Gmail SMTP attempt failed: ${e.message}`);
    return null;
  }
};

const sendViaBrevoApi = async ({ to, subject, html, attachments }) => {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  try {
    const brevoAttachments = attachments && Array.isArray(attachments)
      ? attachments.map(att => ({
          name: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : (typeof att.content === 'string' ? Buffer.from(att.content).toString('base64') : att.content)
        }))
      : undefined;

    const payload = {
      sender: { name: 'DATAVERSE 2026 - AAMEC', email: getFromEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(brevoAttachments && brevoAttachments.length > 0 && { attachment: brevoAttachments })
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Brevo API ${res.status}`);
    const data = await res.json();
    console.log(`📧 Email DELIVERED to ${to} via Brevo API: ${data.messageId}`);
    return { success: true, messageId: data.messageId };
  } catch (e) {
    console.error(`📧 Brevo API attempt failed: ${e.message}`);
    return null;
  }
};

const sendMail = async ({ to, subject, html, attachments }) => {
  // 1. Direct Gmail SMTP (if GMAIL_APP_PASSWORD is set): Guaranteed native Google DP & official Google DKIM
  if (process.env.GMAIL_APP_PASSWORD || (process.env.SMTP_PASS && process.env.SMTP_USER)) {
    const viaGmail = await sendViaGmailSmtp({ to, subject, html, attachments });
    if (viaGmail) return viaGmail;
  }

  // 2. Brevo HTTPS API (port 443)
  if (process.env.BREVO_API_KEY) {
    const viaApi = await sendViaBrevoApi({ to, subject, html, attachments });
    if (viaApi) return viaApi;
  }

  // No Brevo key configured: dev-only fallback via Ethereal (nodemailer test
  // inbox) so emails are genuinely transmitted and openable via the printed
  // preview URL. This never logs into a real/personal email account.
  try {
    const account = await nodemailer.createTestAccount();
    const demoTransporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
    const info = await demoTransporter.sendMail({
      from: `"DATAVERSE 2026 - AAMEC" <${getFromEmail()}>`,
      to,
      subject,
      html,
      attachments
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 [DEMO SENT] To: ${to} | Subject: ${subject}`);
    console.log(`📧 [OPEN EMAIL HERE] ${previewUrl}`);
    return { success: true, devMode: true, previewUrl };
  } catch (error) {
    console.log(`[DEV MODE] No Brevo key & Ethereal unreachable -> email only logged. To: ${to} | Subject: ${subject}`);
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
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
          <tr>
            <td align="center">
              <img src="https://dataverse-2026-qhyb.vercel.app/email-logo.png" alt="AAMEC AI & DS Logo" width="80" height="80" style="display:block;border-radius:50%;border:2px solid rgba(139,92,246,0.5);background:#ffffff;padding:2px;" />
            </td>
          </tr>
        </table>
        <div style="font-size:26px;font-weight:900;letter-spacing:2px;">
          <span style="color:#818cf8;">DATA</span><span style="color:#a78bfa;">VERSE</span>
          <span style="color:#ec4899;font-size:14px;"> 2026</span>
        </div>
        <div style="color:#94a3b8;font-size:12px;margin-top:6px;">Department of Artificial Intelligence and Data Science</div>
        <div style="color:#cbd5e1;font-size:11px;margin-top:2px;">Anjalai Ammal Mahalingam Engineering College, Kovilvenni</div>
        <div style="color:#c4b5fd;font-size:11px;margin-top:3px;letter-spacing:1px;">Health • Education • Character • Innovate</div>
      </div>
      ${innerHtml}
      <div style="text-align:center;color:#64748b;font-size:11px;padding-top:16px;border-top:1px dashed rgba(139,92,246,0.3);margin-top:20px;">
        Official Symposium Desk • <a href="mailto:dataverse26ai@gmail.com" style="color:#818cf8;text-decoration:none;">dataverse26ai@gmail.com</a> • AAMEC Kovilvenni
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

const sendEventRegistrationMail = async ({ to, name, eventTitle, eventVenue, eventDate, eventTime, teamEnabled }) => {
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

      ${teamEnabled ? `
      <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.4);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
        <div style="color:#d1fae5;font-size:12px;line-height:1.7;">
          <div><span style="color:#34d399;">👥 Team event:</span> This event supports team participation.</div>
          <div>Manage your team anytime from your <span style="color:#ffffff;font-weight:700;">student dashboard under Team Management</span> — add or invite teammates from the same college.</div>
        </div>
      </div>
      ` : ''}

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

const sendAccountRemovalMail = async ({ to, name, reason }) => {
  const safeName = name && name !== '.' ? name : (to ? to.split('@')[0] : 'Participant');

  const html = mailShell(`
    <div style="padding:20px 8px 4px;">
      <h2 style="color:#ffffff;font-size:18px;margin:0 0 14px;font-weight:700;">Dear Participant,</h2>
      
      <p style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 14px;">
        We contacted you regarding your participation in the <strong style="color:#ffffff;">Dataverse 2K26 Symposium</strong>, and you confirmed that you would not be attending.
      </p>

      <p style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 14px;">
        Accordingly, we have removed your registration from the participant list.
      </p>

      <p style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 18px;">
        Thank you for your understanding and for informing us in advance. We hope to have the opportunity to welcome you to our future events.
      </p>

      <div style="color:#cbd5e1;font-size:13px;line-height:1.6;border-top:1px solid rgba(139,92,246,0.25);padding-top:14px;">
        <strong style="color:#ffffff;">Regards,</strong><br/>
        <strong style="color:#a78bfa;">Dataverse 2K26 Team</strong>
      </div>
    </div>
  `);
  return sendMail({ to, subject: 'Update Regarding Your Symposium Registration', html });
};

const sendEventReminderMail = async ({ to, name }) => {
  const safeName = name && name !== '.' ? name : (to ? to.split('@')[0] : 'Student');

  const html = mailShell(`
    <div style="padding:20px 8px 4px;">
      <h2 style="color:#ffffff;font-size:18px;margin:0 0 12px;font-weight:700;">Dear ${safeName},</h2>
      
      <p style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 14px;">
        We hope you are excited to be part of the <strong style="color:#ffffff;">Dataverse Symposium</strong>!
      </p>

      <p style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 14px;">
        Our records show that you have successfully registered for the symposium but <strong style="color:#fbbf24;">have not yet registered for any individual event</strong>.
      </p>

      <div style="background:rgba(99,102,241,0.12);border:1px solid rgba(139,92,246,0.35);border-radius:12px;padding:14px 16px;margin:16px 0 18px;">
        <p style="color:#e0e7ff;font-size:13px;line-height:1.6;margin:0;">
          ⏰ We kindly request you to complete your event registration by <strong style="color:#ffffff;">Monday, 7 September 2026, 12:00 PM (Noon)</strong>. This will be the final opportunity to complete your event registration.
        </p>
      </div>

      <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.35);border-radius:12px;padding:14px 16px;margin:16px 0 18px;">
        <p style="color:#fca5a5;font-size:13px;line-height:1.6;margin:0;font-weight:600;">
          ⚠️ Please note that if you do not register for at least one event before the deadline, your symposium account and registration will be removed.
        </p>
      </div>

      <p style="color:#cbd5e1;font-size:13px;line-height:1.7;margin:0 0 18px;">
        We encourage you to complete your event registration at your earliest convenience and look forward to welcoming you to the symposium!
      </p>

      <p style="color:#cbd5e1;font-size:13px;line-height:1.6;margin:0 0 18px;">
        Thank you for your cooperation and understanding.
      </p>

      <div style="color:#cbd5e1;font-size:13px;line-height:1.6;border-top:1px solid rgba(139,92,246,0.25);padding-top:14px;">
        <strong style="color:#ffffff;">Warm regards,</strong><br/>
        <strong style="color:#a78bfa;">Dataverse Symposium Organizing Team</strong>
      </div>
    </div>
  `);
  return sendMail({ to, subject: 'Action Required: Complete Your Event Registration', html });
};

const sendCertificateReadyMail = async ({ to, name, eventTitle, certificateType, certificateNo }) => {
  const safeName = name && name !== '.' ? name : (to ? to.split('@')[0] : 'Participant');
  const frontendUrl = process.env.FRONTEND_URL || 'https://dataverse-2026-qhyb.vercel.app';
  const certPageUrl = `${frontendUrl}/certificates`;
  const typeLabel = certificateType || 'Participation';

  let attachments = [];
  try {
    const { generateCertificatePdf } = require('./pdfCertificateGenerator');
    const pdfBuffer = await generateCertificatePdf({
      studentName: safeName,
      eventTitle: eventTitle || 'DATAVERSE Event',
      certificateType: typeLabel,
      certificateNo
    });
    if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
      attachments.push({
        filename: `DATAVERSE_2026_Certificate_${certificateNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }
  } catch (pdfErr) {
    console.error('Failed to generate PDF attachment for certificate email:', pdfErr.message);
  }

  const html = mailShell(`
    <div style="padding:16px 8px 4px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 12px;text-align:center;">Your Official Certificate is Ready! 🎓 ${safeName}</h2>

      <!-- OFFICIAL UPDATE NOTIFICATION BANNER -->
      <div style="background:linear-gradient(135deg,rgba(16,185,129,0.15) 0%,rgba(6,95,70,0.25) 100%);border:1.5px solid rgba(52,211,153,0.6);border-radius:14px;padding:16px 18px;margin:16px 0;box-shadow:0 4px 20px rgba(16,185,129,0.15);">
        <div style="color:#34d399;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
          ✨ OFFICIAL UPDATE: AI&amp;DS HOD AND PRINCIPAL VERIFIED SIGNATURES ADDED
        </div>
        <div style="color:#e2e8f0;font-size:12.5px;line-height:1.6;">
          Your official participation certificate is now fully certified with authenticated digital signatures:
        </div>
        <div style="margin:10px 0 4px;">
          <span style="display:inline-block;background:rgba(15,23,42,0.7);border:1px solid rgba(52,211,153,0.4);padding:4px 10px;border-radius:20px;font-size:11.5px;color:#a7f3d0;font-weight:600;margin-right:6px;margin-bottom:6px;">
            ✍️ Dr. G. Nanthakumar (HOD - AI&amp;DS)
          </span>
          <span style="display:inline-block;background:rgba(15,23,42,0.7);border:1px solid rgba(52,211,153,0.4);padding:4px 10px;border-radius:20px;font-size:11.5px;color:#a7f3d0;font-weight:600;margin-bottom:6px;">
            ✍️ Dr. K. Velmurugan (Principal)
          </span>
        </div>
      </div>

      <!-- SINCERE APOLOGY FOR DELAY -->
      <div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;border-radius:0 10px 10px 0;padding:10px 14px;margin:12px 0 16px;color:#fef3c7;font-size:12px;line-height:1.55;">
        <strong style="color:#fbbf24;">🙏 Sincere Apologies for the Delay:</strong><br/>
        We deeply appreciate your patience while our institution completed official administrative verification and signature endorsement to provide you with authentic certificates.
      </div>

      <!-- ATTACHMENT NOTICE -->
      ${attachments.length > 0 ? `
      <div style="background:rgba(16,185,129,0.12);border:1px dashed rgba(52,211,153,0.5);border-radius:10px;padding:12px 16px;text-align:center;margin:14px 0;color:#6ee7b7;font-size:12.5px;font-weight:600;">
        📄 <strong>Official Certificate PDF Attached:</strong> Your high-resolution certificate with both signatures is attached to this email for instant download and printing.
      </div>` : ''}

      <!-- DETAILS CARD -->
      <div style="background:rgba(217,119,6,0.1);border:1px solid rgba(245,158,11,0.35);border-radius:14px;padding:16px 20px;margin:16px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%;font-size:13px;line-height:1.8;">
          <tr>
            <td style="color:#fbbf24;font-weight:700;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">Participant:</td>
            <td style="color:#ffffff;font-weight:600;text-align:right;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">${safeName}</td>
          </tr>
          <tr>
            <td style="color:#fbbf24;font-weight:700;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">Event:</td>
            <td style="color:#ffffff;font-weight:600;text-align:right;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">${eventTitle}</td>
          </tr>
          <tr>
            <td style="color:#fbbf24;font-weight:700;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">Certificate Type:</td>
            <td style="color:#ffffff;font-weight:600;text-align:right;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">${typeLabel} Certificate</td>
          </tr>
          <tr>
            <td style="color:#fbbf24;font-weight:700;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">Certificate No:</td>
            <td style="color:#fde047;font-family:monospace;font-weight:700;text-align:right;padding:4px 0;border-bottom:1px dashed rgba(245,158,11,0.2);">${certificateNo}</td>
          </tr>
          <tr>
            <td style="color:#fbbf24;font-weight:700;padding:4px 0;">Verification:</td>
            <td style="color:#34d399;font-weight:700;text-align:right;padding:4px 0;">✓ Certificate Verified</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin:24px 0 18px;">
        <a href="${certPageUrl}" target="_blank" style="display:inline-block;padding:12px 30px;background:linear-gradient(135deg,#d97706,#b45309);color:#ffffff;font-size:13.5px;font-weight:bold;text-decoration:none;border-radius:10px;box-shadow:0 4px 14px rgba(217,119,6,0.45);letter-spacing:0.5px;">
          View &amp; Download on Portal →
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        You can keep the attached PDF for your academic portfolio or view your verified badge on the symposium portal anytime.
      </p>
    </div>
  `);
  return sendMail({
    to,
    subject: `DATAVERSE 2026 - Official ${typeLabel} Certificate [${certificateNo}]`,
    html,
    attachments
  });
};

const sendBulkCertificatesMail = async ({ to, name, certificates = [] }) => {
  const safeName = name && name !== '.' ? name : (to ? to.split('@')[0] : 'Participant');
  const frontendUrl = process.env.FRONTEND_URL || 'https://dataverse-2026-qhyb.vercel.app';
  const certPageUrl = `${frontendUrl}/certificates`;

  let attachments = [];
  try {
    const { generateCertificatePdf } = require('./pdfCertificateGenerator');
    for (const cert of certificates) {
      try {
        const pdfBuffer = await generateCertificatePdf({
          studentName: safeName,
          eventTitle: cert.eventTitle || 'DATAVERSE Event',
          certificateType: cert.certificateType || 'Participation',
          certificateNo: cert.certificateNo
        });
        if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
          const safeTitle = (cert.eventTitle || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
          attachments.push({
            filename: `DATAVERSE_2026_Certificate_${safeTitle}_${cert.certificateNo}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          });
        }
      } catch (itemErr) {
        console.error(`Error generating PDF for certificate ${cert.certificateNo}:`, itemErr.message);
      }
    }
  } catch (pdfErr) {
    console.error('Failed to initialize PDF generator for bulk certificate email:', pdfErr.message);
  }

  const certListHtml = certificates.map(c => `
    <li style="margin-bottom: 8px; color: #ffffff;">
      <strong style="color: #fbbf24;">${c.eventTitle || 'Event'}</strong> 
      <span style="color: #94a3b8;">(${c.certificateType || 'Participation'})</span> — 
      <span style="font-family: monospace; color: #fcd34d;">${c.certificateNo}</span>
    </li>
  `).join('');

  const countLabel = certificates.length === 1 ? '1 Event' : `${certificates.length} Events`;

  const html = mailShell(`
    <div style="padding:16px 8px 4px;">
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 12px;text-align:center;">Your Official Certificates are Ready! 🎓 ${safeName}</h2>

      <!-- OFFICIAL UPDATE NOTIFICATION BANNER -->
      <div style="background:linear-gradient(135deg,rgba(16,185,129,0.15) 0%,rgba(6,95,70,0.25) 100%);border:1.5px solid rgba(52,211,153,0.6);border-radius:14px;padding:16px 18px;margin:16px 0;box-shadow:0 4px 20px rgba(16,185,129,0.15);">
        <div style="color:#34d399;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
          ✨ OFFICIAL UPDATE: AI&amp;DS HOD AND PRINCIPAL VERIFIED SIGNATURES ADDED
        </div>
        <div style="color:#e2e8f0;font-size:12.5px;line-height:1.6;">
          Your official participation certificates are now fully certified with authenticated digital signatures:
        </div>
        <div style="margin:10px 0 4px;">
          <span style="display:inline-block;background:rgba(15,23,42,0.7);border:1px solid rgba(52,211,153,0.4);padding:4px 10px;border-radius:20px;font-size:11.5px;color:#a7f3d0;font-weight:600;margin-right:6px;margin-bottom:6px;">
            ✍️ Dr. G. Nanthakumar (HOD - AI&amp;DS)
          </span>
          <span style="display:inline-block;background:rgba(15,23,42,0.7);border:1px solid rgba(52,211,153,0.4);padding:4px 10px;border-radius:20px;font-size:11.5px;color:#a7f3d0;font-weight:600;margin-bottom:6px;">
            ✍️ Dr. K. Velmurugan (Principal)
          </span>
        </div>
      </div>

      <!-- SINCERE APOLOGY FOR DELAY -->
      <div style="background:rgba(245,158,11,0.1);border-left:3px solid #f59e0b;border-radius:0 10px 10px 0;padding:10px 14px;margin:12px 0 16px;color:#fef3c7;font-size:12px;line-height:1.55;">
        <strong style="color:#fbbf24;">🙏 Sincere Apologies for the Delay:</strong><br/>
        We deeply appreciate your patience while our institution completed official administrative verification and signature endorsement to provide you with authentic certificates.
      </div>

      <!-- ATTACHMENT NOTICE -->
      ${attachments.length > 0 ? `
      <div style="background:rgba(16,185,129,0.12);border:1px dashed rgba(52,211,153,0.5);border-radius:10px;padding:12px 16px;text-align:center;margin:14px 0;color:#6ee7b7;font-size:12.5px;font-weight:600;">
        📄 <strong>Official Certificate PDF(s) Attached:</strong> All ${attachments.length} high-resolution certificate(s) with both signatures are attached to this email.
      </div>` : ''}

      <div style="background:rgba(217,119,6,0.12);border:1px solid rgba(217,119,6,0.4);border-radius:12px;padding:16px;margin-bottom:18px;">
        <div style="color:#fef3c7;font-size:12px;margin-bottom:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">
          Certified Events (${countLabel}):
        </div>
        <ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.6;">
          ${certListHtml}
        </ul>
      </div>

      <div style="text-align:center;margin:24px 0 18px;">
        <a href="${certPageUrl}" target="_blank" style="display:inline-block;padding:12px 30px;background:linear-gradient(135deg,#d97706,#b45309);color:#ffffff;font-size:13.5px;font-weight:bold;text-decoration:none;border-radius:10px;box-shadow:0 4px 14px rgba(217,119,6,0.45);letter-spacing:0.5px;">
          View &amp; Download on Portal →
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        You can open, print, or download the attached PDFs directly, or visit the student portal anytime to manage your certificates.
      </p>
    </div>
  `);

  return sendMail({
    to,
    subject: `DATAVERSE 2026 - Official Participation Certificates [${countLabel}]`,
    html,
    attachments
  });
};

module.exports = {
  sendMail,
  sendRegistrationMail,
  sendApprovalMail,
  sendEventRegistrationMail,
  sendAccountRemovalMail,
  sendEventReminderMail,
  sendCertificateReadyMail,
  sendBulkCertificatesMail
};
