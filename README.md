 #                                                             🌐 DATAVERSE 2026

                                            ### 🚀 Full-Stack Symposium Registration & Event Management Platform

<p align="center">
  <strong>A modern digital platform built to manage symposium registration, event participation, QR verification, team management, announcements, analytics, and on-ground event operations.</strong>
</p>

<p align="center">

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge\&logo=react\&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge\&logo=node.js\&logoColor=white)
![Express](https://img.shields.io/badge/API-Express.js-000000?style=for-the-badge\&logo=express\&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white)
![Tailwind](https://img.shields.io/badge/UI-Tailwind_CSS-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)

</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-setup">Setup</a> •
  <a href="#-roles">Roles</a>
</p>

---

## 🎯 Overview

**DATAVERSE 2026** is a full-stack symposium management system designed for **Anjalai Ammal Mahalingam Engineering College (AAMEC), Kovilvenni, Tamil Nadu**.

The platform brings the complete symposium workflow into one system:

> **Registration → Verification → Event Management → Team Management → Check-In → Participation → Results → Analytics**

Instead of maintaining separate forms, spreadsheets, QR tools, and administrative systems, DATAVERSE 2026 provides a centralized platform for students, coordinators, volunteers, and administrators.

The current repository is structured as a dedicated **React/Vite frontend + Node.js/Express backend**, with MongoDB integration and modular backend layers for controllers, models, routes, middleware, configuration, scripts, and utilities.

---

# ✨ Why DATAVERSE 2026?

### 🧑‍🎓 For Students

* Online symposium registration
* Student profile management
* College ID/document upload
* Event registration
* Team/teammate management
* Registration status tracking
* QR-based registration ticket
* Event participation tracking
* Announcements and updates

### 🛡️ For Administrators

* Centralized student management
* Registration approval/rejection
* Event management
* Staff account management
* Event-wise participant monitoring
* Announcement publishing
* Data export
* Analytics dashboard
* Registration verification

### 🎪 For Event Coordinators

* Event participant monitoring
* Participant lists
* Event-level management
* Winner/result management
* Participant data export

### 🙋 For Volunteers

* QR code scanning
* Manual student search
* Student verification
* College ID verification
* Duplicate check-in protection
* Spot registration support
* ID badge generation

---

# 🚀 Core Features

## 🌐 Public Symposium Website

A modern public-facing symposium portal containing:

* 🎯 Technical events
* 🎉 Non-technical events
* ❓ FAQ section
* 📍 Campus/location information
* 📞 Contact section

---

## 📝 Smart Registration System

The registration system is designed to collect and manage student information digitally.

### Registration workflow

```text
Student
   ↓
Registration Form
   ↓
Document / ID Upload
   ↓
Account Creation
   ↓
Admin Verification
   ↓
Registration Approval
   ↓
Registration ID
   ↓
Event Registration
   ↓
QR Ticket
```

---

# 👥 Team Management

DATAVERSE 2026 supports team-oriented event participation.

Students can:

* Create/manage teams
* Add registered teammates
* Select participating events
* Track team members
* Prevent invalid teammate selection
* Maintain event-specific team information

This makes team-event registration much easier to manage than manual spreadsheet-based workflows.

---

# 📱 QR Verification & Check-In

The platform uses QR-based verification to simplify event-day operations.

### Check-in workflow

```text
Student
   ↓
QR Ticket
   ↓
Volunteer Scanner
   ↓
Student Lookup
   ↓
Registration Verification
   ↓
Duplicate Check
   ↓
✅ Check-In
```

The system can also support manual lookup when QR scanning is unavailable.

---

# 📊 Admin Dashboard

Administrators get a centralized dashboard for monitoring symposium activity.

### Dashboard capabilities

* 📈 Registration analytics
* 👨‍🎓 Student management
* 🎯 Event management
* 👥 Team management
* 🛡️ Approval/rejection workflow
* 👨‍💼 Staff management
* 📢 Announcement management
* 📥 CSV/data export
* 🏆 Event result management
* 🔍 Participant search

---

# 🔐 Role-Based Access Control

DATAVERSE 2026 separates platform functionality based on user roles.

| Role                     | Main Responsibilities                                     |
| ------------------------ | --------------------------------------------------------- |
| 🎓 **Student**           | Registration, event selection, team management, QR ticket |
| 🛡️ **Super Admin**      | Complete platform administration                          |
| 🎪 **Event Coordinator** | Event participants, monitoring, results                   |
| 🙋 **Volunteer**         | QR verification, check-in and student assistance          |

This prevents users from accessing administrative functionality outside their role.

---

# 🧱 Architecture

DATAVERSE 2026 follows a separated full-stack architecture.

```text
                   ┌─────────────────────┐
                   │   Public Website    │
                   │     React + Vite    │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │     REST API        │
                   │ Node.js + Express   │
                   └──────────┬──────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
        Controllers       Middleware        Routes
             │                │                │
             └────────────────┼────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │      Models         │
                   │      Mongoose       │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │      MongoDB        │
                   │   Atlas / Local     │
                   └─────────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* ⚛️ React.js
* ⚡ Vite
* 🎨 Tailwind CSS
* 🎞️ Framer Motion
* 🎯 Lucide Icons
* 📷 HTML5 QR Code
* 🔳 QRCode React
* 📊 Charting libraries

The frontend is organized under `frontend/` with dedicated source, public, scripts, configuration, and deployment files.

## Backend

* 🟢 Node.js
* 🚀 Express.js
* 🔐 JWT Authentication
* 🔒 bcrypt
* 📤 Multer
* 🧩 REST API architecture

The backend is organized into configuration, controllers, middleware, models, routes, scripts, utilities, and server entry points.

## Database

* 🍃 MongoDB
* 🧩 Mongoose

---

# 📁 Project Structure

```text
dataverse-2026/
│
├── .agents/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── .env.example
│   ├── seed.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── scripts/
│   ├── src/
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
│
├── package.json
├── skills-lock.json
└── README.md
```

The repository currently contains dedicated `frontend` and `backend` applications rather than the older single-website structure.

---

# ⚙️ Getting Started

## 📋 Prerequisites

Make sure you have:

* Node.js 18+
* npm
* MongoDB Atlas or local MongoDB
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/yoges-08/dataverse-2026.git

cd dataverse-2026
```

---

## 2️⃣ Install Dependencies

The root project provides a script for installing both frontend and backend dependencies.

```bash
npm run install:all
```

---

## 3️⃣ Configure Backend Environment

Create your environment file:

```bash
cd backend
```

Copy:

```text
.env.example
```

to:

```text
.env
```

Then configure your database and authentication settings.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secure_jwt_secret
```

> Never commit real secrets, passwords, API keys, or database credentials to GitHub.

---

# ▶️ Run the Application

## Start Backend

From the project root:

```bash
npm run backend
```

Backend:

```text
http://localhost:5000
```

## Start Frontend

Open another terminal:

```bash
npm run frontend
```

Frontend:

```text
http://localhost:5173
```

The root `package.json` currently exposes dedicated scripts for installing dependencies, seeding, starting the backend, starting the frontend, and production backend startup.

---

# 🌱 Database Seeding

If your environment is configured for the project's seed workflow:

```bash
npm run seed
```

This runs the backend seed script.

---

# 🔑 Authentication

The platform uses authenticated role-based access.

```text
Login
  ↓
Authentication
  ↓
JWT
  ↓
Role Verification
  ↓
Protected Route
  ↓
Dashboard
```

Administrative features should only be exposed through authenticated and authorized routes.

---

# 📸 Screenshots

> Replace the placeholders below with screenshots of the **current 2026 website and dashboards**.

### 🌐 Public Website

```text
[ Add homepage screenshot here ]
```

### 🎓 Student Dashboard

```text
[ Add student dashboard screenshot here ]
```

### 🛡️ Admin Dashboard

```text
[ Add admin dashboard screenshot here ]
```

### 🎪 Event Management

```text
[ Add event management screenshot here ]
```

### 📱 QR Verification

```text
[ Add QR scanner screenshot here ]
```

---

# 🔄 Complete System Workflow

```text
                    DATAVERSE 2026
                          │
          ┌───────────────┴───────────────┐
          │                               │
       STUDENT                         ADMIN
          │                               │
          ▼                               ▼
    Registration                   Verify Student
          │                               │
          ▼                               ▼
    Event Selection                 Manage Events
          │                               │
          ▼                               ▼
    Team Management                Monitor Users
          │                               │
          ▼                               ▼
      QR Ticket                    Analytics
          │
          ▼
       EVENT DAY
          │
          ▼
     QR Verification
          │
          ▼
       Check-In
          │
          ▼
     Event Participation
          │
          ▼
        Results
```

---

# 🛡️ Security Considerations

For production deployment:

* Use strong JWT secrets
* Store credentials in environment variables
* Never commit `.env`
* Use HTTPS
* Validate uploaded files
* Validate API input
* Restrict administrative endpoints
* Use secure password hashing
* Apply appropriate CORS configuration
* Protect MongoDB credentials
* Change all development/demo credentials before deployment

---

# 📈 Project Goals

DATAVERSE 2026 aims to reduce manual symposium administration by bringing registration, event management, verification, and analytics into one centralized platform.

### The goal:

> **Less paperwork. Less manual verification. Better event management. Better student experience.**

---

# 🚧 Future Improvements

Potential future development areas include:

* 📲 SMS / WhatsApp notification integration
* 🌍 Tamil + English multilingual interface
* 🏆 Public live leaderboard
* 📊 Advanced analytics
* 📧 Automated email notifications
* 🪪 Advanced digital ID card system
* 📱 Progressive Web App support
* 🔔 Real-time notification system
* ☁️ Improved deployment automation

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

```bash
# Fork the repository

# Create a feature branch
git checkout -b feature/your-feature

# Commit your changes
git commit -m "Add your feature"

# Push the branch
git push origin feature/your-feature
```

Then open a Pull Request.

---

# 🏫 Institution

### Anjalai Ammal Mahalingam Engineering College

📍 Kovilvenni, Tiruvarur District,
Tamil Nadu – 614403, India

### DATAVERSE 2026

**Innovate • Inspire • Create**

---

# 📄 License

This project is licensed under the **MIT License**.

See the repository license file for more information.

---

# ⭐ Support the Project

If you find **DATAVERSE 2026** useful or interesting:

⭐ Star the repository
🍴 Fork the project
🐛 Report issues
💡 Suggest improvements
🤝 Contribute to the project

---

<p align="center">

### 💙 Built for DATAVERSE 2026

**Designed • Developed • Deployed**

</p>

<p align="center">

⭐ <strong>DATAVERSE 2026 — Turning Symposium Management into a Digital Experience.</strong> ⭐

</p>
