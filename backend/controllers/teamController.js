const mongoose = require('mongoose');
const crypto = require('crypto');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const mockStore = require('../utils/mockStore');
const { sendTeamLinkMail } = require('../utils/mailer');

const isDbConnected = () => mongoose.connection.readyState === 1;

// 0 (or missing) means solo-only. When positive it is the maximum TOTAL team
// size (leader included), e.g. 4 = leader + up to 3 teammates.
const getEffectiveTeamLimit = (event) =>
  Number.isFinite(event && event.teamLimit) ? event.teamLimit : 0;

const norm = (s) => String(s || '').trim().toUpperCase();

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || 'https://dataverse-2026-qhyb.vercel.app';

const editUrlFor = (editCode) => `${getFrontendUrl()}/team/${editCode}`;

// ---- Mock branch helpers ---------------------------------------------------

const resolveStudentMock = (id) => {
  const s = mockStore.students.find(st => String(st._id) === String(id));
  if (!s) return null;
  const u = mockStore.users.find(usr => String(usr._id) === String(s.user));
  return { ...s, user: u ? { name: u.name } : { name: s.email } };
};

const resolveEventMock = (id) =>
  mockStore.events.find(e => String(e._id) === String(id)) || null;

// ---- Status -----------------------------------------------------------------

const recomputeStatus = (team, event) => {
  const current = (team.members || []).length;
  if (current >= team.teamSize) return 'Complete';
  const deadline = event && event.registrationDeadline;
  if (deadline && new Date() > new Date(deadline)) return 'Incomplete';
  return 'Open';
};

// ---- Serialization -----------------------------------------------------------

const serializeTeam = (team, event) => {
  const leader = isDbConnected() ? team.leader : resolveStudentMock(team.leader);
  const members = (team.members || []).map(m => {
    const st = isDbConnected() ? m.student : resolveStudentMock(m.student);
    return {
      _id: m._id,
      isLeader: !!m.isLeader,
      name: st && (st.user?.name || st.name || st.email) || '',
      registerNumber: st ? (st.registerNumber || 'N/A') : '',
      email: st ? (st.email || '') : '',
      department: st ? (st.department || '') : '',
      year: st ? (st.year || '') : '',
      college: st ? (st.collegeName || '') : ''
    };
  });
  return {
    _id: team._id,
    teamId: team.teamId,
    editCode: team.editCode,
    editUrl: editUrlFor(team.editCode),
    event: isDbConnected()
      ? (event || team.event || null)
      : (event || team.event || resolveEventMock(team.event)),
    college: team.college,
    teamSize: team.teamSize,
    status: recomputeStatus(team, event || (isDbConnected() ? team.event : resolveEventMock(team.event))),
    leader: leader ? {
      _id: leader._id,
      name: leader.user?.name || leader.name || leader.email || '',
      registerNumber: leader.registerNumber || 'N/A',
      email: leader.email || '',
      department: leader.department || '',
      year: leader.year || '',
      college: leader.collegeName || ''
    } : null,
    members,
    memberCount: members.length
  };
};

exports.serializeTeam = serializeTeam;

// ---- Team ID generation ------------------------------------------------------

const nextTeamId = async (event) => {
  let n;
  if (isDbConnected()) {
    n = await Team.countDocuments({ event: event._id });
  } else {
    n = mockStore.teams.filter(t => String(t.event) === String(event._id)).length;
  }
  let teamId = `DV26-T${String(n + 1).padStart(3, '0')}`;
  while (isDbConnected() ? await Team.exists({ teamId }) : mockStore.teams.some(t => t.teamId === teamId)) {
    n += 1;
    teamId = `DV26-T${String(n + 1).padStart(3, '0')}`;
  }
  return teamId;
};

// ---- Create team on registration ---------------------------------------------

exports.createTeamForRegistration = async ({ event, leaderStudent, declaredTeamSize }) => {
  const limit = getEffectiveTeamLimit(event);
  if (limit <= 0) return null; // solo-only event
  const teamSize = Math.max(1, Math.min(Number(declaredTeamSize) || limit, limit));
  const teamId = await nextTeamId(event);
  const editCode = crypto.randomBytes(12).toString('hex');
  const doc = {
    teamId,
    event: event._id,
    leader: leaderStudent._id,
    college: leaderStudent.collegeName,
    teamSize,
    status: 'Open',
    editCode,
    members: [{ student: leaderStudent._id, isLeader: true }]
  };
  let team;
  if (isDbConnected()) {
    team = await Team.create(doc);
  } else {
    team = { _id: 't' + (mockStore.teams.length + 1), ...doc };
    mockStore.teams.push(team);
  }
  team.status = recomputeStatus(team, event);
  if (isDbConnected()) await team.save();
  return team;
};

// ---- Teammate resolution (must be a registered DATAVERSE student) ------------

const findRegisteredStudent = async (registerNumber) => {
  const query = norm(registerNumber).replace(/[^A-Z0-9]/g, '');
  if (isDbConnected()) {
    const candidates = await Student.find({}, 'user registerNumber email phone collegeName department year').lean();
    return candidates.find(s => norm(s.registerNumber).replace(/[^A-Z0-9]/g, '') === query) || null;
  }
  return mockStore.students.find(s => norm(s.registerNumber).replace(/[^A-Z0-9]/g, '') === query) || null;
};

const findStudentByNameAndPhone = async (name, phone) => {
  const qName = norm(name);
  const qPhone = String(phone || '').replace(/[^0-9]/g, '');
  const matches = (s) => {
    if (String(s.phone || '').replace(/[^0-9]/g, '') !== qPhone) return false;
    const sName = norm(s.user?.name || s.email || '');
    return Boolean(sName) && (sName === qName || sName.includes(qName) || qName.includes(sName));
  };
  if (isDbConnected()) {
    const candidates = await Student.find({}, 'user registerNumber email phone collegeName department year')
      .populate('user', 'name')
      .lean();
    return candidates.find(matches) || null;
  }
  return mockStore.students.find(s => {
    const u = mockStore.users.find(usr => String(usr._id) === String(s.user));
    return matches({ ...s, user: u ? { name: u.name } : { name: s.email } });
  }) || null;
};

const isStudentRegisteredForEvent = async (studentId, eventId) => {
  if (isDbConnected()) {
    return !!(await Registration.findOne({ student: studentId, event: eventId }));
  }
  return mockStore.registrations.some(r => String(r.student) === String(studentId) && String(r.event) === String(eventId));
};

const isStudentInAnyTeamForEvent = async (studentId, eventId, excludeTeamId) => {
  if (isDbConnected()) {
    const found = await Team.findOne({
      event: eventId,
      _id: { $ne: excludeTeamId },
      'members.student': studentId
    });
    return !!found;
  }
  return mockStore.teams.some(t =>
    String(t.event) === String(eventId) &&
    String(t._id) !== String(excludeTeamId) &&
    (t.members || []).some(m => String(m.student) === String(studentId))
  );
};

// ---- Team lookup via private edit code (public) ------------------------------

exports.getTeamByCode = async (req, res) => {
  try {
    const { editCode } = req.params;
    let team;
    if (isDbConnected()) {
      team = await Team.findOne({ editCode })
        .populate('event')
        .populate({ path: 'leader', select: 'user registerNumber email collegeName department year phone' })
        .populate({ path: 'members.student', select: 'user registerNumber email collegeName department year phone' });
    } else {
      team = mockStore.teams.find(t => t.editCode === editCode) || null;
    }
    if (!team) return res.status(404).json({ success: false, message: 'Team not found. Check the link or contact the symposium desk.' });
    return res.status(200).json({ success: true, team: serializeTeam(team) });
  } catch (error) {
    console.error('Team lookup error:', error);
    res.status(500).json({ success: false, message: 'Error loading team' });
  }
};

// ---- Add a teammate ----------------------------------------------------------

exports.addTeamMember = async (req, res) => {
  try {
    const { editCode } = req.params;
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Enter your classmate\'s name and phone number.' });
    }

    let team;
    if (isDbConnected()) {
      team = await Team.findOne({ editCode }).populate('event');
    } else {
      team = mockStore.teams.find(t => t.editCode === editCode) || null;
    }
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    const event = isDbConnected() ? team.event : resolveEventMock(team.event);
    const leader = isDbConnected()
      ? await Student.findById(team.leader)
      : resolveStudentMock(team.leader);
    if (!leader) return res.status(404).json({ success: false, message: 'Team leader not found.' });

    if ((team.members || []).length >= team.teamSize) {
      return res.status(400).json({ success: false, message: `Team is full (${team.teamSize} members).` });
    }
    if (recomputeStatus(team, event) === 'Complete') {
      return res.status(400).json({ success: false, message: 'This team is already complete.' });
    }
    if (event && event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline for this event has passed.' });
    }

    const teammate = await findStudentByNameAndPhone(name, phone);
    if (!teammate) {
      return res.status(400).json({ success: false, message: `No registered DATAVERSE student found matching "${name}" (${phone}).` });
    }
    if (norm(teammate.collegeName) !== norm(leader.collegeName)) {
      return res.status(400).json({ success: false, message: `"${name}" belongs to a different college. All team members must be from ${leader.collegeName}.` });
    }
    if (String(teammate._id) === String(team.leader)) {
      return res.status(400).json({ success: false, message: 'You are already the team leader.' });
    }
    if ((team.members || []).some(m => String(m.student) === String(teammate._id))) {
      return res.status(400).json({ success: false, message: 'This student is already in the team.' });
    }
    if (await isStudentInAnyTeamForEvent(teammate._id, team.event, team._id)) {
      return res.status(400).json({ success: false, message: 'This student is already on another team for this event.' });
    }
    const registered = await isStudentRegisteredForEvent(teammate._id, event._id);
    if (!registered) {
      return res.status(400).json({ success: false, message: `"${name}" has not registered for this event. Only students registered for ${event.title || 'this event'} can be added as teammates.` });
    }

    if (isDbConnected()) {
      team.members.push({ student: teammate._id, isLeader: false });
      team.status = recomputeStatus(team, event);
      await team.save();
      team = await Team.findOne({ editCode })
        .populate('event')
        .populate({ path: 'leader', select: 'user registerNumber email collegeName department year phone' })
        .populate({ path: 'members.student', select: 'user registerNumber email collegeName department year phone' });
    } else {
      team.members.push({ student: teammate._id, isLeader: false, addedAt: new Date().toISOString() });
      team.status = recomputeStatus(team, event);
    }

    const serialized = serializeTeam(team, event);
    return res.status(200).json({ success: true, message: `Teammate added.`, team: serialized });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ success: false, message: 'Error adding teammate' });
  }
};

// ---- Remove a teammate -------------------------------------------------------

exports.removeTeamMember = async (req, res) => {
  try {
    const { editCode, memberId } = req.params;
    let team;
    if (isDbConnected()) {
      team = await Team.findOne({ editCode }).populate('event');
    } else {
      team = mockStore.teams.find(t => t.editCode === editCode) || null;
    }
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    const event = isDbConnected() ? team.event : resolveEventMock(team.event);
    const target = (team.members || []).find(m => String(m._id) === String(memberId));
    if (!target) return res.status(404).json({ success: false, message: 'Teammate not found.' });
    if (target.isLeader) return res.status(400).json({ success: false, message: 'The team leader cannot be removed.' });

    if (isDbConnected()) {
      team.members = team.members.filter(m => String(m._id) !== String(memberId));
      team.status = recomputeStatus(team, event);
      await team.save();
    } else {
      team.members = team.members.filter(m => String(m._id) !== String(memberId));
      team.status = recomputeStatus(team, event);
    }

    return res.status(200).json({ success: true, message: 'Teammate removed.', team: serializeTeam(team, event) });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ success: false, message: 'Error removing teammate' });
  }
};

// ---- Update declared team size ----------------------------------------------

exports.updateTeamSize = async (req, res) => {
  try {
    const { editCode } = req.params;
    let team;
    if (isDbConnected()) {
      team = await Team.findOne({ editCode }).populate('event');
    } else {
      team = mockStore.teams.find(t => t.editCode === editCode) || null;
    }
    if (!team) return res.status(404).json({ success: false, message: 'Team not found.' });

    const event = isDbConnected() ? team.event : resolveEventMock(team.event);
    const limit = getEffectiveTeamLimit(event);
    const requested = Number(req.body.teamSize);
    if (!Number.isFinite(requested) || requested < 1) {
      return res.status(400).json({ success: false, message: 'Enter a valid team size.' });
    }
    if (limit > 0 && requested > limit) {
      return res.status(400).json({ success: false, message: `Team size cannot exceed ${limit} members for this event.` });
    }
    if (requested < (team.members || []).length) {
      return res.status(400).json({ success: false, message: `You already have ${team.members.length} member(s). Team size must be at least that.` });
    }

    team.teamSize = requested;
    team.status = recomputeStatus(team, event);
    if (isDbConnected()) await team.save();
    return res.status(200).json({ success: true, message: 'Team size updated.', team: serializeTeam(team, event) });
  } catch (error) {
    console.error('Update team size error:', error);
    res.status(500).json({ success: false, message: 'Error updating team size' });
  }
};

// ---- Admin teams list ----------------------------------------------------------

exports.getAdminTeams = async (req, res) => {
  try {
    const { eventId, status } = req.query;
    const filter = {};
    if (eventId) filter.event = eventId;
    if (status && ['Open', 'Complete', 'Incomplete'].includes(status)) filter.status = status;

    let teams;
    if (isDbConnected()) {
      teams = await Team.find(filter)
        .populate('event')
        .populate({ path: 'leader', select: 'user registerNumber email collegeName department year phone' })
        .populate({ path: 'members.student', select: 'user registerNumber email collegeName department year phone' });
    } else {
      teams = mockStore.teams.filter(t =>
        (!filter.event || String(t.event) === String(filter.event)) &&
        (!filter.status || t.status === filter.status)
      );
    }
    const rows = teams.map(t => serializeTeam(t));
    return res.status(200).json({ success: true, count: rows.length, teams: rows });
  } catch (error) {
    console.error('Admin teams error:', error);
    res.status(500).json({ success: false, message: 'Error fetching teams' });
  }
};

// ---- Attach team info to registrations (event view) ---------------------------

const fetchSerializedTeamsForEvent = async (eventId) => {
  if (isDbConnected()) {
    const teams = await Team.find({ event: eventId })
      .populate('event')
      .populate({ path: 'leader', select: 'user registerNumber email collegeName department year phone' })
      .populate({ path: 'members.student', select: 'user registerNumber email collegeName department year phone' });
    return teams.map(t => serializeTeam(t));
  }
  return mockStore.teams
    .filter(t => String(t.event) === String(eventId))
    .map(t => serializeTeam(t));
};

exports.attachTeamsToRegistrations = async (registrations, eventId) => {
  const teams = await fetchSerializedTeamsForEvent(eventId);
  const byLeader = {};
  teams.forEach(t => { byLeader[String(t.leader && t.leader._id) || ''] = t; });
  return registrations.map(reg => {
    const stId = isDbConnected()
      ? String(reg.student && reg.student._id)
      : String(reg.student);
    const team = byLeader[stId];
    const plain = reg.toObject ? reg.toObject() : { ...reg };
    if (team) plain.team = team;
    else plain.team = null;
    return plain;
  });
};

// ---- Migration: convert legacy registration.teamMembers into Team docs ---------

exports.syncLegacyTeams = async () => {
  let converted = 0;
  if (isDbConnected()) {
    const regs = await Registration.find({ 'teamMembers.0': { $exists: true } }).populate('event').lean();
    for (const reg of regs) {
      const existing = await Team.findOne({ event: reg.event, leader: reg.student });
      if (existing) continue;
      const leader = await Student.findById(reg.student).lean();
      if (!leader) continue;
      const members = [{ student: leader._id, isLeader: true }];
      for (const tm of reg.teamMembers || []) {
        const phones = norm(tm.phone).replace(/[^0-9]/g, '');
        const all = await Student.find({}, 'registerNumber email phone collegeName').lean();
        const found = all.find(s => String(s.phone || '').replace(/[^0-9]/g, '') === phones);
        if (found && norm(found.collegeName) === norm(leader.collegeName)) members.push({ student: found._id, isLeader: false });
      }
      const teamSize = Math.min(members.length, getEffectiveTeamLimit(reg.event) || 1);
      await Team.create({
        teamId: await nextTeamId(reg.event),
        event: reg.event,
        leader: leader._id,
        college: leader.collegeName,
        teamSize: Math.max(1, teamSize),
        status: 'Complete',
        editCode: crypto.randomBytes(12).toString('hex'),
        members
      });
      converted += 1;
    }
  } else {
    for (const reg of mockStore.registrations) {
      if (!reg.teamMembers || reg.teamMembers.length === 0) continue;
      if (mockStore.teams.some(t => String(t.event) === String(reg.event) && String(t.leader) === String(reg.student))) continue;
      const leader = resolveStudentMock(reg.student);
      if (!leader) continue;
      const event = resolveEventMock(reg.event);
      const members = [{ student: leader._id, isLeader: true }];
      for (const tm of reg.teamMembers || []) {
        const phones = norm(tm.phone).replace(/[^0-9]/g, '');
        const found = mockStore.students.find(s => String(s.phone || '').replace(/[^0-9]/g, '') === phones);
        if (found && norm(found.collegeName) === norm(leader.collegeName)) members.push({ student: found._id, isLeader: false });
      }
      const teamSize = Math.min(members.length, getEffectiveTeamLimit(event) || 1);
      mockStore.teams.push({
        _id: 't' + (mockStore.teams.length + 1),
        teamId: await nextTeamId(event),
        event: event._id,
        leader: leader._id,
        college: leader.collegeName,
        teamSize: Math.max(1, teamSize),
        status: 'Complete',
        editCode: crypto.randomBytes(12).toString('hex'),
        members
      });
      converted += 1;
    }
  }
  if (converted > 0) console.log(`Converted ${converted} legacy team registration(s) into Team records.`);
  return converted;
};

// ---- Send the team edit-link email ----------------------------------------------

exports.sendTeamLinkEmail = async ({ student, event, team, userName }) => {
  const editUrl = editUrlFor(team.editCode);
  const limit = getEffectiveTeamLimit(event);
  await sendTeamLinkMail({
    to: student.email,
    name: userName || student.email?.split('@')[0] || 'there',
    eventTitle: event.title,
    teamId: team.teamId,
    teamSize: team.teamSize,
    maxSize: limit,
    editUrl
  }).catch((e) => console.error('Team link email failed:', e.message));
};
