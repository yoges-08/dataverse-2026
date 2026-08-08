const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Attendance = require('./models/Attendance');
const Certificate = require('./models/Certificate');
const Announcement = require('./models/Announcement');
const Gallery = require('./models/Gallery');
require('dotenv').config();

const getRequiredPassword = (envKey, label) => {
  const pw = process.env[envKey];
  if (!pw) {
    throw new Error(`${envKey} environment variable is required to seed the ${label} account`);
  }
  return pw;
};

const seedData = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dataverse_symposium';
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(connStr);
    console.log('Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Attendance.deleteMany({});
    await Certificate.deleteMany({});
    await Announcement.deleteMany({});
    await Gallery.deleteMany({});

    console.log('Cleared old database records.');

    // Create Password Hashes
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash(getRequiredPassword('ADMIN_SEED_PASSWORD', 'Super Admin'), salt);
    const coordPass = await bcrypt.hash(getRequiredPassword('COORDINATOR_SEED_PASSWORD', 'Coordinator'), salt);
    const volPass = await bcrypt.hash(getRequiredPassword('VOLUNTEER_SEED_PASSWORD', 'Volunteer'), salt);

    // 1. Create Core Users
    const adminUser = await User.create({
      name: 'Dr. R. K. Varma (Convener)',
      email: 'dataverse2k26ai@gmail.com',
      password: adminPass,
      role: 'super_admin'
    });

    const coordUser = await User.create({
      name: 'Prof. S. Meenakshi (CSE Coord)',
      email: 'coordinator@aamec.edu.in',
      password: coordPass,
      role: 'coordinator'
    });

    const volUser = await User.create({
      name: 'Karthik Subramanian (Student Vol)',
      email: 'volunteer@aamec.edu.in',
      password: volPass,
      role: 'volunteer'
    });

    console.log('Created Admin, Coordinator, and Volunteer accounts.');

    // 2. Create Events
    const events = await Event.create([
      {
        title: 'Quiz',
        category: 'Technical',
        tagline: 'Test your computer science core skills & technical aptitude',
        description: 'Quiz is the flagship technical quiz competition covering Data Structures, Algorithms, AI, Web Technologies, and Logical Reasoning. Multiple rounds including Prelims, Buzzer Round, and Rapid Fire.',
        rules: [
          'Teams of 2 members allowed.',
          'Use of smartphones during quiz rounds is strictly prohibited.',
          'Judges decision will be final and binding.'
        ],
        venue: 'Auditorium Block A',
        date: '2026-09-15',
        time: '10:00 AM - 12:30 PM',
        registrationDeadline: '2026-09-12',
        maxParticipants: 100,
        currentRegistrations: 0,
        facultyCoordinator: { name: 'Dr. P. Ramesh', phone: '9842100123' },
        studentCoordinator: { name: 'Sanjay Kumar', phone: '9789012345' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Agentic AI Challenge',
        category: 'Technical',
        tagline: 'Build & demonstrate autonomous intelligent AI agents',
        description: 'Design and deploy autonomous AI agents capable of reasoning, tool use, memory recall, and task execution using modern frameworks (LLM APIs, LangChain, AutoGen).',
        rules: [
          'Individual or teams up to 3 members.',
          'Live prototype demonstration mandatory.',
          'Code must be submitted on GitHub before 2:00 PM.'
        ],
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
        title: 'Paper Presentation',
        category: 'Technical',
        tagline: 'Showcase research & innovative engineering papers',
        description: 'Present original research papers on Cloud Computing, Cybersecurity, Machine Learning, IoT, Green Tech, or Blockchain. IEEE template preferred.',
        rules: [
          'PDF abstract upload required during registration.',
          '10 mins presentation + 3 mins Q&A.',
          'Bring 2 printed hard copies of paper.'
        ],
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
        title: 'Layman Vibes',
        category: 'Non-Technical',
        tagline: 'Explain complex tech concepts in humorous layman terms!',
        description: 'A fun communication and creativity event where participants explain complex technological jargon (e.g. Backpropagation, Quantum Encryption, Kubernetes) to non-tech laymen with humor and relatable analogies.',
        rules: [
          'Single participant or pair.',
          'Time limit: 3 minutes per topic.',
          'No vulgarity allowed.'
        ],
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
        title: 'Luminas Fest',
        category: 'Non-Technical',
        tagline: 'Cultural talent showcase & music/art performance',
        description: 'Unleash your inner star! Luminas Fest features music, beatboxing, short skits, digital art live creation, and stage performances.',
        rules: [
          'Max 5 minutes stage allocation per entry.',
          'Track audio must be submitted in MP3 format 1 hour before event start.'
        ],
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
        title: 'Fun & Games Arena',
        category: 'Non-Technical',
        tagline: 'E-Sports, Treasure Hunt, and Mystery Puzzles',
        description: 'Interactive gaming tournament featuring FIFA, BGMI E-Sports, and an campus-wide Augmented Reality Treasure Hunt.',
        rules: [
          'Standard E-Sports rules apply.',
          'Fair play agreement mandatory.'
        ],
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
    ]);

    console.log('Created 6 Symposium Events (Technical & Non-Technical).');

    // No sample/demo students are seeded. Admin starts empty - students register via the website.
    console.log('No demo students seeded (admin panel starts empty).');

    // 4. Create Announcements
    await Announcement.create([
      {
        title: 'DATAVERSE 2026 Online Registrations Open!',
        content: 'Welcome students! Registration for all technical and non-technical events is now live. Complete your registration early to ensure event slot availability.',
        category: 'General',
        priority: 'High'
      },
      {
        title: 'Paper Presentation PDF Submission Deadline Extended',
        content: 'Participants registering for the Paper Presentation event can submit their abstract PDF up to September 12, 2026, 11:59 PM.',
        category: 'Event Update',
        priority: 'Normal'
      },
      {
        title: 'Spot Registration Counter Location',
        content: 'Spot registration counters will open at Main Block Admin Reception on Day 1 from 8:00 AM onwards.',
        category: 'Venue Change',
        priority: 'Urgent'
      }
    ]);

    // 5. Create Gallery Items
    await Gallery.create([
      {
        title: 'DATAVERSE 2025 Inaugural Function',
        category: 'Inauguration',
        year: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
        description: 'Chief guest addressing the grand inaugural ceremony at AAMEC Auditorium.'
      },
      {
        title: 'AI Hackathon & Coding Arena',
        category: 'Technical',
        year: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        description: 'Students building intelligent algorithms during the 24-hour coding challenge.'
      },
      {
        title: 'Cultural Evening & Stage Performance',
        category: 'Cultural',
        year: '2025',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
        description: 'Luminas Fest musical performance & trophy distribution.'
      }
    ]);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
