<div align="center">

# 🌐 DATAVERSE 2026

### Symposium Registration, Team Management & Certificate Verification Platform

**Official Full-Stack Platform for DATAVERSE 2026** — the annual national-level technical & non-technical symposium hosted by **Anjalai Ammal Mahalingam Engineering College (AAMEC)**, Kovilvenni, Tamil Nadu.

**Stack:** React (Vite) · Node.js · Express · MongoDB · JWT

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📖 Overview

DATAVERSE 2026 is a **production-grade, role-based event management platform** that runs the symposium end‑to‑end — public event browsing, student registration and team formation, QR-based on‑site check‑in, certificate issuance with public verification, and live analytics for organizers. Five distinct roles each get a purpose-built dashboard, and the backend ships with hardened defaults (mandatory JWT secret, rate limiting, environment-driven credentials, an offline in-memory data fallback for demo-safety, and Brevo API-based transactional email instead of SMTP login).

---

## ✨ Key Features

### 🎯 Public Symposium Site
- Animated hero with live countdown timer to event day
- **8 live events** across Technical & Non-Technical tracks, each with rules, venue, prize pool, and coordinator info
- Event detail modal, categorized schedule, sponsors showcase, FAQ, campus map & contact form
- Public **Certificate Verification** page — anyone can verify a certificate's authenticity by number/QR, no login required

### 🔐 Role-Based Access Control (5 Roles)

| Role | Capabilities |
|---|---|
| 🎓 **Student** | Register for events, form/join/manage teams (with college-name matching to prevent cross-college teams), upload ID card, receive encrypted QR ticket, forgot/reset password via emailed OTP, view & download issued certificates |
| 🛡️ **Super Admin** | Analytics dashboard, approve/reject registrations with unique `DV2026-REG-XXXX` codes, full event CRUD, staff account creation, announcements publisher, certificate issuance, CSV/Excel export |
| 🎪 **Co-Organizer** | Elevated oversight dashboard alongside Super Admin for shared symposium management |
| 🧭 **Event Coordinator** | Per-event participant monitoring, winner declaration, CSV export for their assigned events |
| 🙋 **Volunteer** | Live webcam QR scanner with duplicate-check protection, spot registration desk, printable student ID badge generator |

### 👥 Team Management
- Students can create or join teams per event with shareable edit codes
- Server-side **college-name matching** (normalizes abbreviations, punctuation & filler words like "College"/"Institute") to catch attempted cross-college team formation
- Database-level uniqueness constraints prevent duplicate team membership even under race conditions
- Dedicated **Team Management** dashboard tab for students and organizers

### 🏆 Certificates
- Participation, Winner, Runner-Up & Third-place certificate types
- Unique certificate numbers with embedded verification QR codes
- Students view/download from **My Certificates**; anyone can validate authenticity on the public verify page

### 📣 Announcements & Attendance
- Admin-published announcements surfaced site-wide
- QR-based attendance/check-in system with duplicate-scan protection

### ⚙️ Resilient, Security-Conscious Backend
- Runs on MongoDB Atlas or local MongoDB, with an **automatic in-memory fallback** for zero-downtime, database-free demos
- JWT secret is **required at boot** — no hardcoded fallback secret
- API-wide rate limiting, configurable CORS allow-list, `bcryptjs` password hashing
- Password reset via one-time OTP email (Brevo transactional API — no SMTP login, avoiding provider account lockouts)
- Seeded staff passwords are supplied via environment variables, never hardcoded in source

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 (Vite 5) · Tailwind CSS · Framer Motion · React Router · React Hook Form · Lucide Icons · Chart.js / react-chartjs-2 · `html5-qrcode` · `qrcode.react` · `html-to-image` · `canvas-confetti` |
| **Backend** | Node.js · Express 4 · JWT Auth · bcryptjs · Multer (uploads) · `qrcode` · `pdfkit` · `xlsx` (Excel export) · Nodemailer / Brevo API · `express-rate-limit` · `compression` |
| **Database** | MongoDB Atlas / Mongoose — with in-memory fallback store for offline demos |

</div>

---

## 🚀 Quick Start

### Prerequisites
- Node.js `>=18.x`
- npm
- MongoDB Atlas URI *(optional — falls back to an in-memory store if omitted)*
- A Brevo (Sendinblue) API key *(optional — required only for real password-reset emails)*

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yoges-08/dataverse-2026.git
cd dataverse-2026

# Installs dependencies for both frontend and backend
npm run install:all
```

### 2️⃣ Configure Environment
Copy the backend example env file and fill in your own values:
```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Recommended | Atlas/local connection string. Without it, data falls back to an in-memory store that does not persist across restarts. |
| `JWT_SECRET` | **Yes** | Long random string. The server refuses to start without it. |
| `PORT` | No | Defaults to `5000`. |
| `CORS_ORIGINS` | Recommended | Comma-separated allowed frontend origins for production. |
| `ADMIN_SEED_PASSWORD` / `COORDINATOR_SEED_PASSWORD` / `VOLUNTEER_SEED_PASSWORD` | For seeding | Passwords used only by `npm run seed` to create the staff accounts. |
| `SHOW_DEV_OTP` | No | Set `true` in local dev to echo the password-reset OTP in the API response. Never `true` in production. |
| `BREVO_API_KEY` / `SMTP_FROM` | For email | Sends OTP/notification emails via the Brevo API — no SMTP login is used anywhere in the app. |

### 3️⃣ (Optional) Seed the Database
```bash
npm run seed
```
This creates the Super Admin, Coordinator, Volunteer & Co-Organizer accounts (from your env-supplied passwords) and the 8 symposium events — no demo student data is seeded; students register through the site.

### 4️⃣ Run Locally
```bash
# Terminal 1 — Backend (Port 5000)
npm run backend

# Terminal 2 — Frontend (Port 5173)
npm run frontend
```

App will be live at `http://localhost:5173` 🎉

> ⚠️ There are no hardcoded demo credentials shipped in this repo — log in with whichever passwords you set in `backend/.env` and seeded via `npm run seed`.

---

## 🎪 Symposium Events

| Event | Category | Format |
|---|---|---|
| **Agentic AI** | Technical | Solo · 4 rounds |
| **NovaSpeak** | Technical | Team (≤4) · Presentation |
| **Knowledge Knockout** | Technical | Solo · 4-level quiz |
| **Bug Hunt** | Technical | Team (≤2) · Debugging rounds |
| **Code Sprint** | Technical | Solo · Scramble / Reverse / Solve |
| **Layman Vibes** | Non-Technical | Team (3) · Games |
| **Luminas Fest** | Non-Technical | Team (≤2) · Skill challenges |
| **Viral Vision** | Non-Technical | Team (≤8) · Reel-making |

*(Full rules, venue, timing, prizes & coordinators are seeded in `backend/seed.js` and served live via the Events API.)*

---

## 📁 Project Structure

```
dataverse-2026/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, QR scanner, modals, countdown, badge generator...
│   │   ├── pages/             # Home, Events, Schedule, Sponsors, FAQ, Contact,
│   │   │                      # Register/Login/Forgot & Reset Password, Team Management,
│   │   │                      # My Certificates, Certificate Verify
│   │   ├── pages/dashboards/  # Admin, Co-Organizer, Coordinator, Volunteer, Student
│   │   ├── context/            # Global auth/app state
│   │   ├── services/           # API client layer
│   │   └── utils/
│   └── vite.config.js
├── backend/
│   ├── routes/       # auth, student, admin, events, attendance, certificates, teams, announcements, contact
│   ├── controllers/  # matching business logic per route group
│   ├── models/        # User, Student, Event, Registration, Team, Certificate, Attendance, Announcement, ContactMessage
│   ├── middleware/    # auth guard, rate limiter
│   ├── utils/          # college-name matcher, mailer (Brevo), in-memory mock store
│   ├── scripts/        # data-integrity maintenance scripts (duplicate/orphaned team fixes)
│   └── seed.js
└── README.md
```

---

## 🔌 API Surface

All routes are mounted under `/api` (rate-limited):

`/api/auth` · `/api/student` · `/api/admin` · `/api/events` · `/api/attendance` · `/api/certificates` · `/api/teams` · `/api/announcements` · `/api/contact`

---

## 🗺️ Roadmap

- [ ] SMS/WhatsApp notifications for registration status
- [ ] Multi-language support (Tamil/English)
- [ ] Public live leaderboard for ongoing events
- [ ] Admin-side certificate bulk-generation UI

---

## 🤝 Contributing

Contributions are what make the open-source community amazing. Any contributions are **greatly appreciated**.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🏫 Institution

<div align="center">

**Anjalai Ammal Mahalingam Engineering College (AAMEC)**
Kovilvenni, Tiruvarur District, Tamil Nadu — 614403

### *Innovate • Inspire • Create*

</div>

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

⭐ **If you find this project useful, consider giving it a star!** ⭐

Made with ❤️ by the DATAVERSE 2026 Organizing Committee

</div>
