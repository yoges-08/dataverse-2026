const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const mockStore = require('../utils/mockStore');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType
} = require('docx');

const isDbConnected = () => mongoose.connection.readyState === 1;

const formatStars = (rating) => {
  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
};

// @desc    Fast check for existing feedback by email or phone (Instant UX check)
// @route   GET /api/feedback/check?email=...&phone=...
// @access  Public
exports.checkFeedback = async (req, res) => {
  try {
    const rawEmail = String(req.query.email || '').trim();
    const rawPhone = String(req.query.phone || '').trim();

    const normalizedEmail = rawEmail.toLowerCase();
    const normalizedPhone = rawPhone.replace(/[\s\-()]/g, '');

    if (!normalizedEmail && !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and/or phone number to check.'
      });
    }

    if (isDbConnected()) {
      if (normalizedEmail) {
        const matchEmail = await Feedback.findOne({ email: normalizedEmail }).lean();
        if (matchEmail) {
          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            matchedField: 'email',
            message: "You've already submitted feedback with this email."
          });
        }
      }

      if (normalizedPhone) {
        const matchPhone = await Feedback.findOne({ phone: normalizedPhone }).lean();
        if (matchPhone) {
          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            matchedField: 'phone',
            message: "You've already submitted feedback with this phone number."
          });
        }
      }

      return res.status(200).json({
        success: true,
        alreadySubmitted: false,
        matchedField: null
      });
    } else {
      // MockStore fallback
      if (!mockStore.feedbacks) mockStore.feedbacks = [];

      if (normalizedEmail) {
        const matchEmail = mockStore.feedbacks.find(
          f => String(f.email || '').toLowerCase() === normalizedEmail
        );
        if (matchEmail) {
          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            matchedField: 'email',
            message: "You've already submitted feedback with this email."
          });
        }
      }

      if (normalizedPhone) {
        const matchPhone = mockStore.feedbacks.find(
          f => String(f.phone || '').replace(/[\s\-()]/g, '') === normalizedPhone
        );
        if (matchPhone) {
          return res.status(200).json({
            success: true,
            alreadySubmitted: true,
            matchedField: 'phone',
            message: "You've already submitted feedback with this phone number."
          });
        }
      }

      return res.status(200).json({
        success: true,
        alreadySubmitted: false,
        matchedField: null
      });
    }
  } catch (error) {
    console.error('Error checking feedback duplicate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify feedback submission status.'
    });
  }
};

// @desc    Submit public symposium event feedback
// @route   POST /api/feedback or /feedback
// @access  Public
exports.submitFeedback = async (req, res) => {
  try {
    const { name, phone, email, collegeName, eventRatings } = req.body;

    // 1. Validate full name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your full name.'
      });
    }

    // 2. Validate and normalize phone
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile phone number.'
      });
    }
    const normalizedPhone = phone.replace(/[\s\-()]/g, '').trim();
    if (normalizedPhone.length < 7 || normalizedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile phone number.'
      });
    }

    // 3. Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format.'
      });
    }

    // 4. Validate collegeName
    if (!collegeName || typeof collegeName !== 'string' || !collegeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your college name.'
      });
    }

    // 5. Validate eventRatings array
    if (!Array.isArray(eventRatings) || eventRatings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please rate at least one event before submitting.'
      });
    }

    // Filter and sanitize rated events
    const sanitizedRatings = eventRatings
      .filter(item => item && Number(item.rating) >= 1 && Number(item.rating) <= 5)
      .map(item => ({
        event: item.event || item.eventId,
        eventTitle: String(item.eventTitle || item.title || 'Event').trim(),
        rating: Math.round(Number(item.rating)),
        comment: item.comment ? String(item.comment).trim() : ''
      }));

    if (sanitizedRatings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please rate at least one event with 1 to 5 stars.'
      });
    }

    // 6. Authoritative Duplicate Check (by Email OR Phone)
    if (isDbConnected()) {
      const existingEmail = await Feedback.findOne({ email: normalizedEmail }).lean();
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "You've already submitted feedback with this email."
        });
      }

      const existingPhone = await Feedback.findOne({ phone: normalizedPhone }).lean();
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "You've already submitted feedback with this phone number."
        });
      }

      try {
        const feedback = await Feedback.create({
          name: name.trim(),
          phone: normalizedPhone,
          email: normalizedEmail,
          collegeName: collegeName.trim(),
          eventRatings: sanitizedRatings
        });

        return res.status(201).json({
          success: true,
          message: 'Thank you for your feedback!',
          feedbackId: feedback._id
        });
      } catch (saveErr) {
        // Handle race conditions or mongo duplicate key index error (E11000)
        if (saveErr.code === 11000 || (saveErr.message && saveErr.message.includes('duplicate key'))) {
          const isPhoneDuplicate = saveErr.keyPattern?.phone || (saveErr.message && saveErr.message.includes('phone'));
          return res.status(400).json({
            success: false,
            message: isPhoneDuplicate
              ? "You've already submitted feedback with this phone number."
              : "You've already submitted feedback with this email."
          });
        }
        throw saveErr;
      }
    } else {
      // MockStore fallback
      if (!mockStore.feedbacks) mockStore.feedbacks = [];

      const matchEmail = mockStore.feedbacks.find(
        f => String(f.email || '').toLowerCase() === normalizedEmail
      );
      if (matchEmail) {
        return res.status(400).json({
          success: false,
          message: "You've already submitted feedback with this email."
        });
      }

      const matchPhone = mockStore.feedbacks.find(
        f => String(f.phone || '').replace(/[\s\-()]/g, '') === normalizedPhone
      );
      if (matchPhone) {
        return res.status(400).json({
          success: false,
          message: "You've already submitted feedback with this phone number."
        });
      }

      const newFeedback = {
        _id: new mongoose.Types.ObjectId(),
        name: name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        collegeName: collegeName.trim(),
        eventRatings: sanitizedRatings,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockStore.feedbacks.push(newFeedback);
      if (typeof mockStore.persist === 'function') mockStore.persist();

      return res.status(201).json({
        success: true,
        message: 'Thank you for your feedback!',
        feedbackId: newFeedback._id
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback. Please try again later.'
    });
  }
};

// @desc    Get all feedback entries (Admin only)
// @route   GET /api/admin/feedback or /api/feedback/admin
// @access  Private (Super Admin)
exports.getAllFeedback = async (req, res) => {
  try {
    let feedback = [];

    if (isDbConnected()) {
      feedback = await Feedback.find().sort({ createdAt: -1 }).lean();
    } else {
      if (!mockStore.feedbacks) mockStore.feedbacks = [];
      feedback = [...mockStore.feedbacks].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    return res.status(200).json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback list.'
    });
  }
};

// @desc    Export all feedback as Word document (.docx)
// @route   GET /api/admin/feedback/export or /api/feedback/admin/export
// @access  Private (Super Admin)
exports.exportFeedbackDocx = async (req, res) => {
  try {
    let feedback = [];

    if (isDbConnected()) {
      feedback = await Feedback.find().sort({ createdAt: -1 }).lean();
    } else {
      if (!mockStore.feedbacks) mockStore.feedbacks = [];
      feedback = [...mockStore.feedbacks].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    // Calculate quick stats
    let totalRatingsCount = 0;
    let sumRating = 0;
    feedback.forEach(f => {
      (f.eventRatings || []).forEach(er => {
        totalRatingsCount++;
        sumRating += (er.rating || 0);
      });
    });
    const avgRating = totalRatingsCount > 0 ? (sumRating / totalRatingsCount).toFixed(1) : 'N/A';

    // Build Word Document rows
    const tableHeader = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'S.No', bold: true, color: 'FFFFFF', size: 20 })] })]
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Participant Details', bold: true, color: 'FFFFFF', size: 20 })] })]
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Submitted Date', bold: true, color: 'FFFFFF', size: 20 })] })]
        }),
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: '4F46E5', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: 'Event Ratings & Feedback Comments', bold: true, color: 'FFFFFF', size: 20 })] })]
        })
      ]
    });

    const dataRows = feedback.map((item, index) => {
      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }) : '—';

      // Build paragraphs for each rated event
      const eventParagraphs = [];
      if (!item.eventRatings || item.eventRatings.length === 0) {
        eventParagraphs.push(new Paragraph({ children: [new TextRun({ text: 'No event ratings', italics: true, size: 18 })] }));
      } else {
        item.eventRatings.forEach((er, i) => {
          const stars = formatStars(er.rating);
          eventParagraphs.push(
            new Paragraph({
              spacing: { before: i > 0 ? 120 : 40, after: 40 },
              children: [
                new TextRun({ text: `• ${er.eventTitle}: `, bold: true, size: 20, color: '1E1B4B' }),
                new TextRun({ text: `${stars} (${er.rating}/5)`, bold: true, size: 20, color: 'D97706' })
              ]
            })
          );
          if (er.comment && er.comment.trim()) {
            eventParagraphs.push(
              new Paragraph({
                indent: { left: 240 },
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: `Comment: "${er.comment.trim()}"`, italics: true, size: 18, color: '4B5563' })
                ]
              })
            );
          }
        });
      }

      return new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(index + 1), size: 18, bold: true })] })]
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: item.name || 'Participant', bold: true, size: 20, color: '1E1B4B' })] }),
              new Paragraph({ children: [new TextRun({ text: `Email: ${item.email || '—'}`, size: 18, color: '4338CA' })] }),
              new Paragraph({ children: [new TextRun({ text: `Phone: ${item.phone || '—'}`, size: 18, color: '059669' })] }),
              new Paragraph({ children: [new TextRun({ text: `College: ${item.collegeName || '—'}`, size: 18, color: '374151', italics: true })] })
            ]
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: dateStr, size: 17, color: '4B5563' })] })]
          }),
          new TableCell({
            width: { size: 48, type: WidthType.PERCENTAGE },
            children: eventParagraphs
          })
        ]
      });
    });

    const doc = new Document({
      title: 'DATAVERSE 2026 Event Feedback Report',
      description: 'Public symposium event feedback and ratings report',
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: 'DATAVERSE 2026 — Public Event Feedback & Ratings',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'Anjalai Ammal Mahalingam Engineering College (AAMEC) • Department of AI & Data Science',
                italics: true,
                size: 20,
                color: '6B7280'
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: 'Report Summary: ', bold: true, size: 20 }),
              new TextRun({ text: `Total Submissions: ${feedback.length} | `, size: 20 }),
              new TextRun({ text: `Total Event Ratings: ${totalRatingsCount} | `, size: 20 }),
              new TextRun({ text: `Overall Average Rating: ${avgRating} / 5 | `, size: 20 }),
              new TextRun({ text: `Generated: ${new Date().toLocaleString('en-IN')}`, size: 18, italics: true })
            ]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeader, ...dataRows]
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="DATAVERSE_Feedback_${Date.now()}.docx"`);
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating feedback Word docx:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export feedback Word document.'
    });
  }
};
