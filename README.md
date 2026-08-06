# DATAVERSE 2026 — Symposium Registration & Management System

Full-stack platform for the annual **National-Level Technical & Non-Technical Symposium** conducted by **Anjalai Ammal Mahalingam Engineering College**, Kovilvenni, Tamil Nadu.

*Innovate • Inspire • Create*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, Framer Motion, Chart.js, html5-qrcode |
| Backend | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, PDFKit, `qrcode` |
| Database | MongoDB Atlas / local MongoDB — **auto-fallback to an in-memory data engine** when no live MongoDB URI is configured |
| UI Theme | Blue & Purple Futuristic Glassmorphism with dark/light toggle |

## Features

- **Public portal**: hero with live countdown, event catalog (Technical + Non-Technical), Day 1/Day 2 schedule, gallery, sponsors, FAQ, contact.
- **Role-based access (RBAC)**: Super Admin, Event Coordinator, Volunteer, Student.
- **Student registration**: 15+ fields, photo & college ID upload, automatic `DV2026-REG-XXXX` symposium code + QR ticket. **Emails are sent automatically**: confirmation with the code + QR ticket on signup, another with the QR ticket on admin approval, a booking confirmation each time a student registers for an event, and a sign-in security alert whenever a student logs in. Duplicate registration with the **same email or the same phone number** is rejected.
- **Admin dashboard**: registered-students table with photo/QR preview/download, 1-click approve/reject, staff & event management, live analytics, CSV export.
- **Volunteer QR check-in**: live webcam scanning (html5-qrcode), Reg-ID/Symposium-Code lookup, ID verification modal, duplicate check-in lock, printable badge, **Spot/Walk-in registration** (`DV2026-SPOT-XXXX`).
- **Coordinator**: event participant lists, winner declaration, attendance tracking, certificate generation.
- **Certificates**: PDF/printable certificates with embedded verification QR, public verification page.
- **Announcements & gallery**: managed content shown on the public site.

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment (optional)

Backend works out-of-the-box in **in-memory mode** (no database required). To use MongoDB, create `backend/.env`:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/dataverse_symposium
JWT_SECRET=your_own_secret_key
PORT=5000

# Email delivery (symposium code + QR ticket to registered students)
# Leave SMTP_* blank to run in DEV MODE (emails are logged to the console, not delivered)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM="DATAVERSE 2026"
```

> **Email delivery:** With `SMTP_*` set, emails are **delivered to real student inboxes**. If no SMTP is configured, the app still *sends* every email through **Ethereal** (nodemailer's free test SMTP) and prints a clickable **"OPEN EMAIL HERE"** preview URL in the backend console — so you can open and verify the actual sent email (subject, QR code, symposium code, event details). To send to students' real Gmail/college addresses, put your real SMTP credentials in `.env` (Gmail: enable 2-Step Verification, create an **App Password** for `SMTP_PASS`).

### 3. Run backend

```bash
npm run backend
# http://localhost:5000/api/health
```

### 4. Run frontend

```bash
npm run frontend
# http://localhost:5173  (proxies /api to the backend)
```

## Seed Data (in-memory / `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Super Admin | `dataverse2k26ai@gmail.com` | `aids@2025` |
| Coordinator | `coordinator@aamec.edu.in` | `coord123` |
| Volunteer | `volunteer@aamec.edu.in` | `vol123` |
| Student | `student1@aamec.edu.in` | `student123` |

Seed data includes 6 events (Quiz, Agentic AI Challenge, Paper Presentation, Layman Vibes, Luminas Fest, Fun & Games), 3 students with QR tickets, attendance logs, certificates, announcements and gallery items.

> The in-memory data engine resets on every backend restart. Connect MongoDB and run `npm run seed` for persistent, database-backed data.

## API Overview

| Route | Purpose |
|---|---|
| `/api/auth/*` | register-student, login, me, forgot/reset password |
| `/api/student/*` | profile, registered events, spot registration |
| `/api/admin/*` | analytics, students CRUD + approve/reject, staff |
| `/api/events/*` | list/detail, create/update/delete, event registration, winners |
| `/api/attendance/*` | verify (scan/lookup), check-in, logs |
| `/api/certificates/*` | my certificates, generate, public verify |
| `/api/announcements`, `/api/gallery` | public + admin managed content |

## Verification Workflow (manual)

1. Student registers → gets `DV2026-REG-XXXX` + QR.
2. Student logs in → registers for Technical & Non-Technical events.
3. Admin approves the student registration.
4. Volunteer scans QR / enters Reg-ID → verifies ID → **Check In** (duplicate attempts locked).
5. Coordinator uploads winners → generates student certificate PDF.
6. Admin views analytics & exports CSV.

## Scripts

```bash
npm run install:all  # install backend + frontend deps
npm run seed         # seed MongoDB database
npm run backend      # start Express API (port 5000)
npm run frontend     # start Vite dev server (port 5173)
npm run start        # start backend in production mode
```
