const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const templatePath = path.join(__dirname, '..', 'assets', 'cert-participation-template.jpg');
const extraBoldFontPath = path.join(__dirname, '..', 'assets', 'fonts', 'LeagueSpartan-ExtraBold.ttf');
const boldFontPath = path.join(__dirname, '..', 'assets', 'fonts', 'LeagueSpartan-Bold.ttf');

function formatStudentName(name) {
  if (!name || typeof name !== 'string') return 'Participant';
  const trimmed = name.trim();
  if (!trimmed || trimmed === '.' || trimmed.length < 1) return 'Participant';
  if (trimmed === trimmed.toLowerCase()) {
    return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return trimmed;
}

/**
 * Generates an official high-resolution PDF certificate for a participant.
 *
 * @param {Object} options
 * @param {string} options.studentName - Full name of the student
 * @param {string} options.eventTitle - Title of the event
 * @param {string} [options.certificateType] - e.g. 'Participation', 'Winner', etc.
 * @param {string} options.certificateNo - Unique certificate serial number
 * @returns {Promise<Buffer>} - Resolves to PDF file Buffer
 */
function generateCertificatePdf({ studentName, eventTitle, certificateType, certificateNo }) {
  return new Promise((resolve, reject) => {
    try {
      const cleanStudentName = formatStudentName(studentName);
      const cleanEventTitle = (eventTitle || 'DATAVERSE SYMPOSIUM EVENT').trim().toUpperCase();

      const doc = new PDFDocument({
        size: [1024, 723],
        margin: 0,
        info: {
          Title: `DATAVERSE 2026 Certificate - ${cleanStudentName}`,
          Author: 'Department of AI & DS, Anjalai Ammal Mahalingam Engineering College',
          Subject: `${cleanEventTitle} - ${certificateType || 'Participation'} Certificate`,
          Keywords: 'DATAVERSE 2026, Certificate, AAMEC, AI & DS'
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // 1. Render Background Template (1024 x 723)
      if (fs.existsSync(templatePath)) {
        doc.image(templatePath, 0, 0, { width: 1024, height: 723 });
      }

      // 2. Register and configure League Spartan font
      if (fs.existsSync(extraBoldFontPath)) {
        doc.registerFont('LeagueSpartan', extraBoldFontPath);
        doc.font('LeagueSpartan');
      } else if (fs.existsSync(boldFontPath)) {
        doc.registerFont('LeagueSpartan', boldFontPath);
        doc.font('LeagueSpartan');
      } else {
        doc.font('Helvetica-Bold');
      }

      // 3. Student Name on Line 1 (Calibrated over blank line 1)
      doc.fontSize(24)
         .fillColor('#090d16')
         .text(cleanStudentName, 365, 418, {
           width: 295,
           align: 'center',
           lineBreak: false
         });

      // 4. Event Title on Line 2 (Calibrated over blank line 2)
      doc.fontSize(18)
         .fillColor('#1e1b4b')
         .text(cleanEventTitle, 120, 454, {
           width: 295,
           align: 'center',
           lineBreak: false
         });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCertificatePdf
};
