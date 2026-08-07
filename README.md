# DATAVERSE 2026 - Symposium Registration & Management System

Official Full-Stack Registration, QR Verification, and Event Management System for **DATAVERSE 2026**, the annual national-level symposium hosted by **Anjalai Ammal Mahalingam Engineering College**, Kovilvenni, Tamil Nadu.

Repository: [https://github.com/yoges-08/dataverse-2026.git](https://github.com/yoges-08/dataverse-2026.git)

---

## 🌟 Key Features

- **Public Symposium Portal**:
  - Hero Section with countdown timer & prize pool highlight (₹1,00,000+).
  - Technical Competitions: QuizEE, Agentic AI, Paper Presentation (PDF Upload).
  - Non-Technical Events: Layman Vibes, Luminas Fest, Fun & Games Arena.
  - Symposium Timeline, Categorized Media Gallery & Lightbox, Sponsors, FAQ, Contact Form & Campus Map.

- **Role-Based Access Control (RBAC)**:
  - **Student**: Online registration (15+ fields, ID card upload), ticket receipt with encrypted QR Code, registered events tracking, E-Certificate download.
  - **Super Admin**: Analytics Overview, Student Management (Approve/Reject with specific `DV2026-REG-XXXX` codes), Event CRUD, Staff Accounts Creation, Announcements Publisher, CSV Exporter.
  - **Event Coordinator**: Participant monitoring, winner declaration, CSV list export.
  - **Volunteer**: Live Webcam QR Code Scanner, Manual Student Lookup, College ID Verification Modal, 1-Click Check-In with duplicate check-in protection, Spot Registration Desk for Walk-In Students, Printable Student ID Badge Generator.

- **Resilient Backend & Offline Hybrid Data Engine**:
  - Operates connected to MongoDB Atlas / Local MongoDB, with automatic fallback in-memory data store for seamless zero-downtime offline demonstrations.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Framer Motion, Lucide Icons, QR Code Generators & Web Scanners (`html5-qrcode`, `qrcode.react`), Chart.js / Recharts.
- **Backend**: Node.js, Express.js, JWT Authentication, bcrypt, Multer, QR Code Generator, PDFKit / Certificate Engine.
- **Database**: MongoDB Atlas / Mongoose (with built-in in-memory fallback engine).

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/yoges-08/dataverse-2026.git
cd dataverse-2026

# Install dependencies for both frontend and backend
npm run install:all
```

### 2. Running Locally
```bash
# Run backend server (Port 5000)
npm run backend

# In a new terminal, run frontend dev server (Port 5173)
npm run frontend
```

### 3. Demo Credentials for Evaluation

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@aamec.edu.in` | `admin123` |
| **Event Coordinator** | `coordinator@aamec.edu.in` | `coord123` |
| **Volunteer Desk** | `volunteer@aamec.edu.in` | `vol123` |
| **Student** | `student1@aamec.edu.in` | `student123` |

---

## 🏫 Institution Details

- **College**: Anjalai Ammal Mahalingam Engineering College (AAMEC)
- **Location**: Kovilvenni, Tiruvarur District, Tamil Nadu - 614403
- **Symposium**: DATAVERSE 2026
- **Tagline**: *Innovate • Inspire • Create*
