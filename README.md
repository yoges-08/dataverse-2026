<div align="center">

# 🌐 DATAVERSE 2026

### Symposium Registration, QR Verification & Event Management System

**Official Full-Stack Platform for DATAVERSE 2026** — the annual national-level technical & non-technical symposium hosted by **Anjalai Ammal Mahalingam Engineering College (AAMEC)**, Kovilvenni, Tamil Nadu.

**Tech Stack:** React (Vite) · Node.js · Express · MongoDB


</div>

---

## 📖 Overview

DATAVERSE 2026 is a **production-grade, role-based event management platform** built to handle end-to-end symposium operations — from public registration and QR-based check-in, to live analytics dashboards for organizers. It's designed to run reliably even without a live database connection, thanks to a built-in offline fallback engine, making it demo-safe and presentation-ready anywhere.

---

## ✨ Key Features

### 🎯 Public Symposium Portal
- Hero section with live countdown timer & prize pool highlight
- **Technical Events**: QuizEE, Agentic AI, Paper Presentation (with PDF upload)
- **Non-Technical Events**: Layman Vibes, Luminas Fest, Fun & Games Arena
- Interactive symposium timeline, categorized media gallery with lightbox
- Sponsors showcase, FAQ section, contact form & campus map

### 🔐 Role-Based Access Control (RBAC)

| Role | Capabilities |
|---|---|
| 🎓 **Student** | 15+ field online registration, ID card upload, encrypted QR ticket receipt, registered-events tracker |
| 🛡️ **Super Admin** | Analytics overview, student approval/rejection with `DV2026-REG-XXXX` codes, event CRUD, staff account creation, announcements publisher, CSV exporter |
| 🎪 **Event Coordinator** | Participant monitoring, winner declaration, CSV list export |
| 🙋 **Volunteer** | Live webcam QR scanner,  1-click check-in with duplicate protection, spot registration desk, printable ID badge generator |

### ⚙️ Resilient Backend & Offline Hybrid Data Engine
- Runs on **MongoDB Atlas** or local MongoDB
- Automatic **in-memory fallback** for zero-downtime offline demos — no database, no problem

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|---|---|
| **Frontend** | React.js (Vite) · Tailwind CSS · Framer Motion · Lucide Icons · `html5-qrcode` · `qrcode.react` · Chart.js / Recharts |
| **Backend** | Node.js · Express.js · JWT Authentication · bcrypt · Multer · QR Code Generator |
| **Database** | MongoDB Atlas / Mongoose (with in-memory fallback engine) |

</div>

---

## 🚀 Quick Start

### Prerequisites
- Node.js `>=18.x`
- npm or yarn
- MongoDB Atlas URI *(optional — falls back to in-memory store)*

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yoges-08/dataverse-2026.git
cd dataverse-2026

# Installs dependencies for both frontend and backend
npm run install:all
```

### 2️⃣ Run Locally
```bash
# Terminal 1 — Backend (Port 5000)
npm run backend

# Terminal 2 — Frontend (Port 5173)
npm run frontend
```

App will be live at `http://localhost:5173` 🎉

### 3️⃣ Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🛡️ Super Admin | `admin@aamec.edu.in` | `admin123` |
| 🎪 Event Coordinator | `coordinator@aamec.edu.in` | `coord123` |
| 🙋 Volunteer Desk | `volunteer@aamec.edu.in` | `vol123` |
| 🎓 Student | `student1@aamec.edu.in` | `student123` |

> ⚠️ Change these credentials before deploying to production.

---

## 📁 Project Structure

```
dataverse-2026/
├── frontend/          # React + Vite client
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
├── backend/           # Node.js + Express API
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── ...
└── README.md
```

---

## 🗺️ Roadmap

- [ ] Team-based event registration (leader + teammate flow)
- [ ] SMS/WhatsApp notifications for registration status
- [ ] Multi-language support (Tamil/English)
- [ ] Public leaderboard for live events

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
