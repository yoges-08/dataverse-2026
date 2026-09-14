const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const templatePath = path.join(__dirname, '..', 'assets', 'cert-participation-template.jpg');
const fontPath = path.join(__dirname, '..', 'assets', 'fonts', 'LeagueSpartan-Variable.ttf');

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
      const doc = new PDFDocument({
        size: [1024, 723],
        margin: 0,
        info: {
          Title: `DATAVERSE 2026 Certificate - ${studentName}`,
          Author: 'Department of AI & DS, Anjalai Ammal Mahalingam Engineering College',
          Subject: `${eventTitle} - ${certificateType || 'Participation'} Certificate`,
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
      if (fs.existsSync(fontPath)) {
        doc.registerFont('LeagueSpartan', fontPath);
        doc.font('LeagueSpartan');
      } else {
        doc.font('Helvetica-Bold');
      }

      // 3. Student Name on Line 1 (Calibrated over blank line 1)
      const cleanStudentName = studentName && studentName !== '.' ? studentName : 'Participant';
      doc.fontSize(22)
         .fillColor('#0f172a')
         .text(cleanStudentName, 365, 424, {
           width: 295,
           align: 'center',
           lineBreak: false
         });

      // 4. Event Title on Line 2 (Calibrated over blank line 2)
      const cleanEventTitle = (eventTitle || 'DATAVERSE SYMPOSIUM EVENT').toUpperCase();
      doc.fontSize(17)
         .fillColor('#78350f')
         .text(cleanEventTitle, 120, 458, {
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
