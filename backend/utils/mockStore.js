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
    this.gallery = [];
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
      this.gallery = raw.gallery || [];
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
        announcements: this.announcements,
        gallery: this.gallery
      };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('Persist warning:', e.message);
    }
  }

  async init() {
    if (this.restored) return; // data already loaded from disk - do not re-seed

    console.log('⚡ Initializing DATAVERSE In-Memory Data Engine (fresh seed)...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('aids@2025', salt);
    const coordPass = await bcrypt.hash('coord123', salt);
    const volPass = await bcrypt.hash('vol123', salt);

    // Users
    const uAdmin = { _id: 'u1', name: 'Dr. R. K. Varma (Convener)', email: 'dataverse2k26ai@gmail.com', password: adminPass, role: 'super_admin', isEmailVerified: true };
    const uCoord = { _id: 'u2', name: 'Prof. S. Meenakshi (CSE Coord)', email: 'coordinator@aamec.edu.in', password: coordPass, role: 'coordinator', isEmailVerified: true };
    const uVol = { _id: 'u3', name: 'Karthik Subramanian (Student Vol)', email: 'volunteer@aamec.edu.in', password: volPass, role: 'volunteer', isEmailVerified: true };

    // Staff accounts only. NO demo student accounts / registrations - Admin starts empty.
    this.users = [uAdmin, uCoord, uVol];

    // Events
    this.events = [
      {
        _id: 'e1',
        title: 'Quiz',
        category: 'Technical',
        tagline: 'Test your computer science core skills & technical aptitude',
        description: 'Quiz is the flagship technical quiz competition covering Data Structures, Algorithms, AI, Web Technologies, and Logical Reasoning.',
        rules: ['Teams of 2 members allowed.', 'Smartphones prohibited.', 'Judges decision final.'],
        venue: 'Auditorium Block A',
        date: '2026-09-15',
        time: '10:00 AM - 12:30 PM',
        registrationDeadline: '2026-09-12',
        maxParticipants: 100,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Dr. P. Ramesh', phone: '9842100123' },
        studentCoordinator: { name: 'Sanjay Kumar', phone: '9789012345' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80',
        winnersUploaded: true,
        winners: [
          { position: '1st Place', studentName: 'Balaji S', college: 'Anjalai Ammal Mahalingam Engg College', regNo: '820421104001' },
          { position: '2nd Place', studentName: 'Priya Dharshini M', college: 'NIT Trichy', regNo: '820421104015' }
        ]
      },
      {
        _id: 'e2',
        title: 'Agentic AI Challenge',
        category: 'Technical',
        tagline: 'Build & demonstrate autonomous intelligent AI agents',
        description: 'Design and deploy autonomous AI agents capable of reasoning, tool use, memory recall, and task execution.',
        rules: ['Individual or teams up to 3.', 'Live prototype mandatory.'],
        venue: 'CS Lab 3 & High Performance Computing Center',
        date: '2026-09-15',
        time: '11:00 AM - 03:00 PM',
        registrationDeadline: '2026-09-12',
        maxParticipants: 60,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Prof. K. Anand', phone: '9842100456' },
        studentCoordinator: { name: 'Preethi Sundar', phone: '9876543210' },
        prizes: { first: '₹7,500 + Trophy & Certificate', second: '₹4,500 + Trophy & Certificate', third: '₹2,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e3',
        title: 'Paper Presentation',
        category: 'Technical',
        tagline: 'Showcase research & innovative engineering papers',
        description: 'Present original research papers on Cloud Computing, Cybersecurity, Machine Learning, IoT, Green Tech, or Blockchain.',
        rules: ['PDF abstract upload required.', '10 mins presentation.'],
        venue: 'Seminar Hall B',
        date: '2026-09-15',
        time: '01:30 PM - 04:30 PM',
        registrationDeadline: '2026-09-10',
        maxParticipants: 50,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Dr. M. Sangeetha', phone: '9842100789' },
        studentCoordinator: { name: 'Vigneshwaran R', phone: '9790123456' },
        prizes: { first: '₹6,000 + Trophy & Certificate', second: '₹3,500 + Trophy & Certificate', third: '₹2,000 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        pdfRequired: true
      },
      {
        _id: 'e4',
        title: 'Layman Vibes',
        category: 'Non-Technical',
        tagline: 'Explain complex tech concepts in humorous layman terms!',
        description: 'A fun communication and creativity event where participants explain complex technological jargon to laymen with humor.',
        rules: ['Single or pair.', '3 minutes limit.'],
        venue: 'Open Air Theatre (OAT)',
        date: '2026-09-16',
        time: '10:00 AM - 12:30 PM',
        registrationDeadline: '2026-09-14',
        maxParticipants: 80,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Prof. T. Vijay', phone: '9842100999' },
        studentCoordinator: { name: 'Abinaya S', phone: '9840123456' },
        prizes: { first: '₹4,000 + Trophy & Certificate', second: '₹2,500 + Trophy & Certificate', third: '₹1,000 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e5',
        title: 'Luminas Fest',
        category: 'Non-Technical',
        tagline: 'Cultural talent showcase & music/art performance',
        description: 'Unleash your inner star! Luminas Fest features music, beatboxing, short skits, digital art live creation, and stage performances.',
        rules: ['5 minutes stage allocation.'],
        venue: 'Main College Auditorium',
        date: '2026-09-16',
        time: '01:30 PM - 04:30 PM',
        registrationDeadline: '2026-09-14',
        maxParticipants: 120,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Dr. G. Revathi', phone: '9842100888' },
        studentCoordinator: { name: 'Dinesh Karthik', phone: '9789123456' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      },
      {
        _id: 'e6',
        title: 'Fun & Games Arena',
        category: 'Non-Technical',
        tagline: 'E-Sports, Treasure Hunt, and Mystery Puzzles',
        description: 'Interactive gaming tournament featuring FIFA, BGMI E-Sports, and an campus-wide Augmented Reality Treasure Hunt.',
        rules: ['Standard E-Sports rules apply.'],
        venue: 'Student Activity Center',
        date: '2026-09-16',
        time: '10:30 AM - 03:30 PM',
        registrationDeadline: '2026-09-14',
        maxParticipants: 150,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Prof. N. Balaji', phone: '9842100777' },
        studentCoordinator: { name: 'Hariharan B', phone: '9841123456' },
        prizes: { first: '₹4,500 + Trophy & Certificate', second: '₹2,500 + Trophy & Certificate', third: '₹1,200 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
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

    // Gallery
    this.gallery = [
      {
        _id: 'g1',
        title: 'DATAVERSE 2025 Inaugural Ceremony',
        category: 'Inauguration',
        year: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
        description: 'Chief guest addressing the grand inaugural ceremony at AAMEC Auditorium.'
      },
      {
        _id: 'g2',
        title: 'AI Agentic Coding Arena',
        category: 'Technical',
        year: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        description: 'Students constructing autonomous AI agents.'
      },
      {
        _id: 'g3',
        title: 'Luminas Fest Musical Night',
        category: 'Cultural',
        year: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
        description: 'Stage performance & trophy presentation.'
      }
    ];

    console.log('✅ DATAVERSE In-Memory Data Engine initialized with 6 events, admin, coordinator & volunteer. No students seeded (starts empty).');
    this.persist();
  }
}

const mockStore = new MockStore();
module.exports = mockStore;
module.exports.persist = mockStore.persist.bind(mockStore);
