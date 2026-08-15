const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

class MockStore {
  constructor() {
    this.isMock = true;
    this.users = [];
    this.students = [];
    this.events = [];
    this.registrations = [];
    this.attendance = [];
    this.certificates = [];
    this.announcements = [];
    this.dataFile = path.join(__dirname, '..', 'data', 'db.json');
    // Restore previously saved data (survives server restarts)
    this.restored = this.loadFromFile();
    this.init();
  }

  loadFromFile() {
    try {
      if (!fs.existsSync(this.dataFile)) return false;
      const raw = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      this.users = raw.users || [];
      this.students = raw.students || [];
      this.events = raw.events || [];
      this.registrations = raw.registrations || [];
      this.attendance = raw.attendance || [];
      this.certificates = raw.certificates || [];
      this.announcements = raw.announcements || [];
      console.log('💾 Restored DATAVERSE data from local storage (backend/data/db.json).');
      return true;
    } catch (e) {
      console.warn('Failed to restore saved data, starting fresh:', e.message);
      return false;
    }
  }

  persist() {
    try {
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        users: this.users,
        students: this.students,
        events: this.events,
        registrations: this.registrations,
        attendance: this.attendance,
        certificates: this.certificates,
        announcements: this.announcements
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('Persist warning:', e.message);
    }
  }

  async init() {
    if (this.restored) return; // data already loaded from disk - do not re-seed

    console.log('⚡ Initializing DATAVERSE In-Memory Data Engine (fresh seed)...');

    // Security: never seed staff accounts with hardcoded default passwords. If
    // the env vars are missing we fail loudly instead of exposing a guessable
    // admin/coordinator/volunteer login (same contract as seed.js).
    const adminPassRaw = process.env.ADMIN_SEED_PASSWORD;
    const coordPassRaw = process.env.COORDINATOR_SEED_PASSWORD;
    const volPassRaw = process.env.VOLUNTEER_SEED_PASSWORD;
    if (!adminPassRaw || !coordPassRaw || !volPassRaw) {
      throw new Error(
        'ADMIN_SEED_PASSWORD, COORDINATOR_SEED_PASSWORD, and VOLUNTEER_SEED_PASSWORD ' +
        'must be set even for offline/in-memory mode. Refusing to seed staff accounts with default passwords.'
      );
    }

    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash(adminPassRaw, salt);
    const coordPass = await bcrypt.hash(coordPassRaw, salt);
    const volPass = await bcrypt.hash(volPassRaw, salt);

    // Users
    const uAdmin = { _id: 'u1', name: 'Dr. R. K. Varma (Convener)', username: 'admin', email: 'dataverse2k26ai@gmail.com', password: adminPass, role: 'super_admin', isEmailVerified: true };
    const uCoord = { _id: 'u2', name: 'Prof. S. Meenakshi (CSE Coord)', username: 'coordinator', email: 'coordinator@aamec.edu.in', password: coordPass, role: 'coordinator', isEmailVerified: true };
    const uVol = { _id: 'u3', name: 'Karthik Subramanian (Student Vol)', username: 'volunteer', email: 'volunteer@aamec.edu.in', password: volPass, role: 'volunteer', isEmailVerified: true };

    // Staff accounts only. NO demo student accounts / registrations - Admin starts empty.
    this.users = [uAdmin, uCoord, uVol];

    // Events
    this.events = [
      {
        _id: 'e1',
        title: 'Agentic AI',
        category: 'Technical',
        tagline: 'Test your AI knowledge, logic, and creativity',
        description: 'Agentic AI is a fun and challenging event that tests your AI knowledge, logical thinking, creativity, and problem-solving skills through different rounds.',
        rules: [
          'The event consists of 4 rounds.',
          'Each round lasts between 15 - 20 minutes.',
          'Four participants compete in each round.',
          'You must complete the given task within the specified time.',
          'Cheating is strictly prohibited.'
        ],
        venue: 'CC1 Lab',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 60,
        currentRegistrations: 0,
        teamLimit: 4,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Pavithran', phone: '' },
        prizes: { first: '₹7,500 + Trophy & Certificate', second: '₹4,500 + Trophy & Certificate', third: '₹2,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e2',
        title: 'NovaSpeak',
        category: 'Technical',
        tagline: 'Present your ideas with clarity and confidence',
        description: 'It is the event where you can present and explain your ideas.',
        rules: [
          'Presentation duration is 15 minutes.',
          'The presentation must be delivered in English.',
          'Malpractice is strictly prohibited.'
        ],
        venue: 'MB-110 (Smart Class)',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 50,
        currentRegistrations: 0,
        teamLimit: 4,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Yazhnithi', phone: '' },
        prizes: { first: '₹6,000 + Trophy & Certificate', second: '₹3,500 + Trophy & Certificate', third: '₹2,000 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        pdfRequired: false
      },
      {
        _id: 'e3',
        title: 'Knowledge Knockout',
        category: 'Technical',
        tagline: 'Assess your knowledge through targeted questions and tests',
        description: 'Knowledge Knockout is a process of assessing a person\'s knowledge through targeted questions or tests.',
        rules: [
          'Each level is ten minutes.',
          'Team participation is not allowed; only individual participation is permitted.',
          'Each level consists of 15 questions.',
          'Mobile phones are strictly prohibited during the quiz.',
          'LEVEL 01 - GENERAL KNOWLEDGE',
          'LEVEL 02 - TECHNICAL TOPICS',
          'LEVEL 03 - RAPID FIRE',
          'LEVEL 04 - BUZZER CHALLENGE'
        ],
        venue: 'A/C Conference Hall',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 100,
        currentRegistrations: 0,
        teamLimit: 0,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Kavipriya', phone: '' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e4',
        title: 'Layman Vibes',
        category: 'Non-Technical',
        tagline: 'Explain complex tech concepts the fun way',
        description: 'A fun non-technical event featuring exciting games that test creativity, observation, logical thinking, communication, and teamwork.',
        rules: [
          'Team size: 3 members.',
          'Follow the coordinators instructions.',
          'Malpractice is strictly prohibited.',
          'Judges decision will be final.'
        ],
        venue: 'A/C Conference Hall',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 80,
        currentRegistrations: 0,
        teamLimit: 3,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Sarumathi', phone: '' },
        prizes: { first: '₹4,000 + Trophy & Certificate', second: '₹2,500 + Trophy & Certificate', third: '₹1,000 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e5',
        title: 'Luminas Fest',
        category: 'Non-Technical',
        tagline: 'Step beyond the technical world into fun and creativity',
        description: 'A celebration of fun, creativity, and skill-based challenges that test quick thinking, communication, observation, memory, and presence of mind.',
        rules: [
          'Registration and punctuality are required - participants must register on time and reach the venue at the scheduled time.',
          'Time and instructions must be followed as given by the coordinators.',
          'Fair play is expected from all participants.',
          'Participants must maintain discipline throughout the event.',
          'The coordinators judgement will be final.'
        ],
        venue: 'A/C Conference Hall',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 120,
        currentRegistrations: 0,
        teamLimit: 2,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Sarumathi', phone: '' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e7',
        title: 'Viral Vision',
        category: 'Non-Technical',
        tagline: 'Create a reel that tells your story',
        description: 'Create a reel by turning your ideas into a creative and engaging video, and share your message with the world.',
        rules: [
          'Last date for submission: 09/09/2026.',
          'Create your reel based on the given topics.',
          'Use only your original ideas and creativity.',
          'Avoid unnecessary music and inappropriate content.',
          'Keep the reel short, engaging, and meaningful.'
        ],
        venue: 'A/C Conference Hall',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-09',
        maxParticipants: 80,
        currentRegistrations: 0,
        teamLimit: 4,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Sriram', phone: '' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=800&q=80'
      }
    ];

    // Students - empty on startup (no demo student accounts)
    this.students = [];

    // Registrations - intentionally EMPTY: no student is pre-registered to any event.
    // Students must register for events themselves (triggers the event-booking email).
    this.registrations = [];

    // Attendance Log - empty on startup
    this.attendance = [];

    // Certificates - empty on startup
    this.certificates = [];

    // Announcements
    this.announcements = [
      {
        _id: 'an1',
        title: 'DATAVERSE 2026 Online Registrations Open!',
        content: 'Welcome students! Registration for all technical and non-technical events is now live at Anjalai Ammal Mahalingam Engineering College, Kovilvenni.',
        category: 'General',
        priority: 'High',
        author: 'Symposium Admin',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'an2',
        title: 'Paper Presentation Abstract Deadline Extended',
        content: 'Paper presentation upload deadline extended to September 12th. Please ensure your IEEE format paper PDF is attached during registration.',
        category: 'Event Update',
        priority: 'Normal',
        author: 'Prof. S. Meenakshi',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    console.log('✅ DATAVERSE In-Memory Data Engine initialized with 7 events, admin, coordinator & volunteer. No students seeded (starts empty).');
    this.persist();
  }
}

const mockStore = new MockStore();
module.exports = mockStore;
module.exports.persist = mockStore.persist.bind(mockStore);
