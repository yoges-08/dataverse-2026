const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Student = require('./models/Student');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Attendance = require('./models/Attendance');
const Certificate = require('./models/Certificate');
const Announcement = require('./models/Announcement');
require('dotenv').config();

const getRequiredPassword = (envKey, label) => {
  const pw = process.env[envKey];
  if (!pw) {
    throw new Error(`${envKey} environment variable is required to seed the ${label} account`);
  }
  return pw;
};

// Sync Admin / Coordinator / Volunteer accounts from env vars on every startup.
// Lets the organizer change names/emails/passwords without touching code:
//   ADMIN_NAME / ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_SEED_PASSWORD
//   COORDINATOR_NAME / COORDINATOR_USERNAME / COORDINATOR_EMAIL / COORDINATOR_SEED_PASSWORD
//   VOLUNTEER_NAME / VOLUNTEER_USERNAME / VOLUNTEER_EMAIL / VOLUNTEER_SEED_PASSWORD
// Password is only changed when the _SEED_PASSWORD var is present.
const syncStaffAccounts = async () => {
  if (mongoose.connection.readyState !== 1) return 0;

  const accounts = [
    { role: 'super_admin', key: 'ADMIN', defaultName: 'Dr. R. K. Varma (Convener)', defaultUsername: 'admin', defaultEmail: 'dataverse2k26ai@gmail.com' },
    { role: 'coordinator', key: 'COORDINATOR', defaultName: 'Prof. S. Meenakshi (CSE Coord)', defaultUsername: 'coordinator', defaultEmail: 'coordinator@aamec.edu.in' },
    { role: 'volunteer', key: 'VOLUNTEER', defaultName: 'Karthik Subramanian (Student Vol)', defaultUsername: 'volunteer', defaultEmail: 'volunteer@aamec.edu.in' }
  ];

  for (const acc of accounts) {
    try {
      const name = process.env[`${acc.key}_NAME`] || acc.defaultName;
      const username = (process.env[`${acc.key}_USERNAME`] || acc.defaultUsername).toLowerCase().trim();
      const email = process.env[`${acc.key}_EMAIL`] || acc.defaultEmail;
      const password = process.env[`${acc.key}_SEED_PASSWORD`];

      // Find the existing staff account. Only adopt a user whose role matches the
      // target role - never a student who happens to share the email/username.
      let user = await User.findOne({ role: acc.role });
      if (!user) user = await User.findOne({ role: acc.role, email });
      if (!user) user = await User.findOne({ role: acc.role, username });

      if (!user) {
        // No matching-role account exists. Create one, but ONLY if the email and
        // username are not already taken by a different account (e.g. a student).
        const emailTaken = await User.findOne({ email });
        const usernameTaken = await User.findOne({ username });
        if (emailTaken || usernameTaken) {
          throw new Error(
            `${acc.key}_EMAIL "${email}" or username "${username}" is already used by a ${emailTaken ? emailTaken.role : 'different'} account. ` +
            `Set a unique ${acc.key}_EMAIL and ${acc.key}_USERNAME in env (or the email currently belongs to a student).`
          );
        }
        if (!password) {
          throw new Error(`${acc.key}_SEED_PASSWORD environment variable is required to create the ${acc.role} account`);
        }
        user = new User({ role: acc.role });
      }

      user.name = name;
      user.username = username;
      user.email = email;
      if (password && password.trim()) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
      }
      await user.save();
      console.log(`Synced ${acc.role} account -> ${user.email} (username: ${user.username})`);
    } catch (err) {
      console.error(`Skipped syncing ${acc.role} account: ${err.message}`);
    }
  }
  return accounts.length;
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

    console.log('Cleared old database records.');

    // Create Password Hashes
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash(getRequiredPassword('ADMIN_SEED_PASSWORD', 'Super Admin'), salt);
    const coordPass = await bcrypt.hash(getRequiredPassword('COORDINATOR_SEED_PASSWORD', 'Coordinator'), salt);
    const volPass = await bcrypt.hash(getRequiredPassword('VOLUNTEER_SEED_PASSWORD', 'Volunteer'), salt);

    // 1. Create Core Users
    const adminUser = await User.create({
      name: 'Dr. R. K. Varma (Convener)',
      username: 'admin',
      email: 'dataverse2k26ai@gmail.com',
      password: adminPass,
      role: 'super_admin'
    });

    const coordUser = await User.create({
      name: 'Prof. S. Meenakshi (CSE Coord)',
      username: 'coordinator',
      email: 'coordinator@aamec.edu.in',
      password: coordPass,
      role: 'coordinator'
    });

    const volUser = await User.create({
      name: 'Karthik Subramanian (Student Vol)',
      username: 'volunteer',
      email: 'volunteer@aamec.edu.in',
      password: volPass,
      role: 'volunteer'
    });

    console.log('Created Admin, Coordinator, and Volunteer accounts.');

    // 2. Create Events
    const events = await Event.create([
      {
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
        title: 'Bug Hunt',
        category: 'Technical',
        tagline: 'Find Fast. Fix Smart. Win Big!',
        description: 'A fun coding challenge where participants must find, fix and defeat bugs! Tackle syntax, logical, runtime, and complex interconnected bugs across multiple debugging rounds.',
        rules: [
          'Team participation limit: 2 members.',
          '• Round 1 – Bug Basics: Find and fix simple syntax & logical errors.',
          '• Round 2 – Bug breaker: Hunt and fix multiple hidden bugs including syntax, logic & runtime errors. Each bug = Points.',
          '• Round 3 – Debugging Battle: Solve a complex program with interconnected bugs and pass all test cases.',
          'Participants must debug the given programs only.',
          'No internet or external help during the event.',
          'Each round must be completed within the given time limit.',
          'Bugs must be identified and fixed correctly.',
          'Points will be awarded for every correctly fixed bug.',
          'In the final round, speed + accuracy + test cases passed will decide the winner.',
          'Any form of malpractice will lead to disqualification.',
          'Judges\' decision will be final and binding.',
          'Find Fast. Fix Smart. Win Big!'
        ],
        venue: 'CC2 Lab',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 60,
        currentRegistrations: 0,
        teamLimit: 2,
        requiresLanguageChoice: true,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Student Coordinator', phone: '' },
        prizes: { first: '₹6,000 + Trophy & Certificate', second: '₹3,500 + Trophy & Certificate', third: '₹2,000 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Code Sprint',
        category: 'Technical',
        tagline: 'Reconstruct code, arrange scrambled programs, and solve coding challenges',
        description: 'Participants will reconstruct code, arrange scrambled programs, and tackle selected coding problems. Each round tests logical thinking, coding skills, and problem-solving ability.',
        rules: [
          'No Team participation only solo performance.',
          'The event consists of 3 rounds.',
          'Time Limit: 15 minutes for each round.',
          'Participants must submit working and error-free solutions within the given time.',
          'Scoring: Points are awarded based on correctness, completion and difficulty level.',
          'Malpractice is strictly prohibited.'
        ],
        venue: 'CC1 Lab',
        date: '2026-09-12',
        time: '',
        registrationDeadline: '2026-09-11',
        maxParticipants: 60,
        currentRegistrations: 0,
        teamLimit: 0,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Student Coordinator', phone: '' },
        prizes: { first: '₹6,000 + Trophy & Certificate', second: '₹3,500 + Trophy & Certificate', third: '₹2,000 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80'
      },
      {
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
        teamLimit: 8,
        facultyCoordinator: { name: '', phone: '' },
        studentCoordinator: { name: 'Sriram', phone: '' },
        prizes: { first: '₹5,000 + Trophy & Certificate', second: '₹3,000 + Trophy & Certificate', third: '₹1,500 + Certificate' },
        bannerImage: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=800&q=80'
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
        title: 'Event Registrations Closing Soon!',
        content: 'Hurry! Registrations for all technical and non-technical events close on September 11, 2026, 11:59 PM. Viral Vision reel submission closes on September 9, 2026.',
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

    console.log('Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Seeding Error:', error);
    throw error;
  }
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedData;
module.exports.syncStaffAccounts = syncStaffAccounts;
