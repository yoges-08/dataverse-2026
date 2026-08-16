const mongoose = require('mongoose');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Student = require('../models/Student');
const mockStore = require('../utils/mockStore');
const { collegesMatch } = require('../utils/collegeMatch');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Transactions require a replica set / Atlas dedicated tiers. Shared tiers
// (M0/M2/M5) do not support them; probe once and fall back to a best-effort
// atomic update for team-member additions.
let txSupported = true;
let txProbeDone = false;

// Classify an error thrown by startTransaction/commitTransaction. The old
// regex-based probe misread normal concurrent write conflicts (whose message
// contains the word "transaction") as "transactions unsupported" and then
// permanently downgraded every add for the life of the process. Instead:
//  - 'transient'    -> TransientTransactionError write conflict. This is the
//                      NORMAL result of two adds racing; transactions are in
//                      fact working. Never downgrade, and let the request
//                      recover/retry instead of dying.
//  - 'unsupported'  -> genuine no-replica-set deployment (IllegalOperation /
//                      specific code-20 text). Only this downgrades the probe.
//  - 'other'        -> real unexpected error, rethrow.
const classifyTxError = (err) => {
  if (!err) return 'other';
  if (Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError')) {
    return 'transient';
  }
  if (err.code === 20 || /Transaction numbers are only allowed on a replica set member or mongos/i.test(err.message || '')) {
    return 'unsupported';
  }
  return 'other';
};
exports.classifyTxError = classifyTxError;

// 0 (or missing) means solo-only. When positive it is the maximum TOTAL team
// size (leader included), e.g. 4 = leader + up to 3 teammates.
const getEffectiveTeamLimit = (event) =>
  Number.isFinite(event && event.teamLimit) ? event.teamLimit : 0;

const norm = (s) => String(s || '').trim().toUpperCase();

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
  const limit = getEffectiveTeamLimit(event);
  if (limit > 0 && current >= limit) return 'Complete';
  const deadline = event && event.registrationDeadline;
  if (deadline && new Date() > new Date(deadline)) return 'Incomplete';
  return 'Open';
};

// ---- Serialization -----------------------------------------------------------

const serializeTeam = (team, event) => {
  // Dedupe by student id so a garbled/legacy `members` array never shows the
  // same person twice or inflates the member count.
  const seen = new Set();
  const members = (team.members || [])
    .filter(m => {
      const id = String(m.student && (m.student._id || m.student) || '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice()
    .sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0))
    .map(m => {
      const st = isDbConnected() ? m.student : resolveStudentMock(m.student);
      return {
        _id: m._id,
        studentId: st ? String(st._id || (st._id && st._id.toString())) : '',
        name: st && (st.user?.name || st.name || st.email) || '',
        department: st ? (st.department || '') : '',
        year: st ? (st.year || '') : '',
        addedAt: m.addedAt
      };
    });
  return {
    _id: team._id,
    teamId: team.teamId,
    event: isDbConnected()
      ? (event || team.event || null)
      : (event || team.event || resolveEventMock(team.event)),
    college: team.college,
    teamSize: getEffectiveTeamLimit(event || (isDbConnected() ? team.event : resolveEventMock(team.event))),
    status: recomputeStatus(team, event || (isDbConnected() ? team.event : resolveEventMock(team.event))),
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

exports.createTeamForRegistration = async ({ event, leaderStudent, session }) => {
  const limit = getEffectiveTeamLimit(event);
  if (limit <= 0) return null; // solo-only event

  // Idempotency: if the student already has a team for this event, return it
  // instead of creating a second one. This closes the auto-create-during-
  // registration vs auto-create-on-page-load race at the course-grained level;
  // the unique (event + member) DB index is the fine-grained backstop below.
  const existing = await findTeamForStudent(event._id, leaderStudent._id);
  if (existing) return existing;

  const teamId = await nextTeamId(event);
  const doc = {
    teamId,
    event: event._id,
    leader: leaderStudent._id,
    college: leaderStudent.collegeName,
    teamSize: limit,
    status: 'Open',
    members: [{ student: leaderStudent._id, addedAt: new Date() }]
  };
  let team;
  try {
    if (isDbConnected()) {
      team = await Team.create(doc, session ? { session } : undefined);
    } else {
      // Mirror the DB's unique (event, member) constraint in the mock so the
      // two stores can't diverge: a student already on ANY team for this event
      // (including two simultaneous creates of the same student) is rejected.
      const collides = mockStore.teams.some(t =>
        String(t.event) === String(event._id) &&
        (t.members || []).some(m => String(m.student) === String(leaderStudent._id))
      );
      if (collides) {
        const simErr = new Error('E11000 duplicate key');
        simErr.code = 11000;
        throw simErr;
      }
      team = { _id: 't' + (mockStore.teams.length + 1), ...doc };
      mockStore.teams.push(team);
    }
  } catch (createErr) {
    // Two requests created the same team at the same instant; the DB's
    // unique (event, members.student) index rejected the loser. Return the
    // team that already won instead of failing the whole request.
    if (createErr.code === 11000) {
      const winner = await findTeamForStudent(event._id, leaderStudent._id);
      if (winner) return winner;
    }
    throw createErr;
  }
  team.status = recomputeStatus(team, event);
  if (isDbConnected()) await (session ? team.save({ session }) : team.save());
  return team;
};

// ---- Session-based authorization ---------------------------------------------
// Every team-management action requires a logged-in student who is either the
// leader or a member of the specific team being acted on. Possession of an
// internal team ID is NOT sufficient — the edit-code backdoor is gone.

const assertIsTeamMember = async (team, userId) => {
  if (isDbConnected()) {
    const student = await Student.findOne({ user: userId });
    if (!student) return null;
    const isMember = (team.members || []).some(m => String(m.student) === String(student._id));
    return isMember ? student : null;
  }
  const student = mockStore.students.find(s => String(s.user) === String(userId));
  if (!student) return null;
  const isMember = (team.members || []).some(m => String(m.student) === String(student._id));
  return isMember ? student : null;
};

// Find the team for this event that the logged-in student belongs to — or null.
// All members are equal; no member carries a special role.
const findTeamForStudent = async (eventId, studentId) => {
  if (isDbConnected()) {
    return Team.findOne({
      event: eventId,
      $or: [{ leader: studentId }, { 'members.student': studentId }]
    }).populate('event');
  }
  return mockStore.teams.find(t =>
    String(t.event) === String(eventId) &&
    (String(t.leader) === String(studentId) || (t.members || []).some(m => String(m.student) === String(studentId)))
  ) || null;
};

// ---- Registration helpers ------------------------------------------------------

const isStudentRegisteredForEvent = async (studentId, eventId) => {
  if (isDbConnected()) {
    return !!(await Registration.findOne({ student: studentId, event: eventId }));
  }
  return mockStore.registrations.some(r => String(r.student) === String(studentId) && String(r.event) === String(eventId));
};

const isStudentInAnyTeamForEvent = async (studentId, eventId, excludeTeamId) => {
  // A solo team (just the leader, auto-created at registration) is a seat, not
  // a commitment — only teams with more than one member count as "taken".
  if (isDbConnected()) {
    const found = await Team.findOne({
      event: eventId,
      _id: { $ne: excludeTeamId },
      'members.student': studentId,
      $expr: { $gt: [{ $size: '$members' }, 1] }
    });
    return !!found;
  }
  return mockStore.teams.some(t =>
    String(t.event) === String(eventId) &&
    String(t._id) !== String(excludeTeamId) &&
    (t.members || []).some(m => String(m.student) === String(studentId)) &&
    (t.members || []).length > 1
  );
};

// When a student joins another team, their own auto-created solo team is no
// longer needed — dissolve it so nobody is tracked in two teams for one event.
// Must run BEFORE the member-push rides the unique (event, member) index.
const dissolveAbandonedSoloTeam = async (studentId, eventId, keepTeamId, session) => {
  if (isDbConnected()) {
    await Team.deleteMany({
      event: eventId,
      _id: { $ne: keepTeamId },
      'members.student': studentId,
      $expr: { $lte: [{ $size: '$members' }, 1] }
    }, session ? { session } : undefined);
    return;
  }
  const idx = mockStore.teams.findIndex(t =>
    String(t.event) === String(eventId) &&
    String(t._id) !== String(keepTeamId) &&
    (t.members || []).length <= 1 &&
    (t.members || []).some(m => String(m.student) === String(studentId))
  );
  if (idx !== -1) mockStore.teams.splice(idx, 1);
};

const fetchTeamForResponse = async (team) => {
  if (isDbConnected()) {
    return Team.findById(team._id)
      .populate('event')
      .populate({ path: 'members.student', select: 'user registerNumber email collegeName department year phone', populate: { path: 'user', select: 'name' } });
  }
  return team;
};

// ---- My team-enabled events ----------------------------------------------------

exports.getMyTeamEvents = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (isDbConnected()) {
      const student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
      const regs = await Registration.find({ student: student._id, status: { $ne: 'Cancelled' } })
        .populate({ path: 'event', select: 'title category venue date time teamLimit description' });
      const events = regs
        .map(r => r.event)
        .filter(ev => ev && getEffectiveTeamLimit(ev) > 0);
      return res.status(200).json({ success: true, count: events.length, events });
    }
    const student = mockStore.students.find(s => String(s.user) === String(userId));
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    const events = mockStore.registrations
      .filter(r => String(r.student) === String(student._id) && r.status !== 'Cancelled')
      .map(r => resolveEventMock(r.event))
      .filter(ev => ev && getEffectiveTeamLimit(ev) > 0);
    return res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    console.error('My team events error:', error);
    res.status(500).json({ success: false, message: 'Error loading your team events' });
  }
};

// ---- My team for an event --------------------------------------------------------

exports.getMyTeamForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id || req.user._id;
    const student = isDbConnected()
      ? await Student.findOne({ user: userId })
      : mockStore.students.find(s => String(s.user) === String(userId));
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const event = isDbConnected() ? await Event.findById(eventId) : resolveEventMock(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (getEffectiveTeamLimit(event) <= 0) {
      return res.status(400).json({ success: false, message: 'This event is solo-only — no teams allowed.' });
    }

    const registered = await isStudentRegisteredForEvent(student._id, eventId);
    if (!registered) return res.status(403).json({ success: false, message: 'You must register for this event before managing a team.' });

    let team = await findTeamForStudent(eventId, student._id);
    if (!team) {
      // Safe recovery: an existing (pre-team) registration had no Team created.
      // Auto-place the registrant into a solo team as leader. Re-check after
      // (re)creation so a concurrent addTeamMember cannot leave a stray
      // duplicate solo team behind.
      if (isDbConnected() && txSupported) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          // Re-check INSIDE the transaction — closes the race against a
          // concurrent addTeamMember that might be committing right now.
          team = await Team.findOne({
            event: eventId,
            $or: [{ leader: student._id }, { 'members.student': student._id }]
          }).session(session);

          if (!team) {
            team = await exports.createTeamForRegistration({ event, leaderStudent: student, session });
          }

          await session.commitTransaction();
        } catch (txErr) {
          await session.abortTransaction();

          // A transient write conflict is NORMAL under concurrent recovery —
          // it means a racing addTeamMember committed first, which is fine.
          // Only a genuine "no replica set" error may disable transactions.
          const txKind = classifyTxError(txErr);
          if (txKind === 'transient') {
            // Don't downgrade; fall through to the best-effort recovery below,
            // which re-checks and prefers a real (2+) team over a stray solo.
            // Drop any in-memory team that was created-but-not-committed so the
            // fallback re-queries and starts from a clean slate.
            team = null;
          } else {
            if (!txProbeDone && txKind === 'unsupported') {
              txSupported = false;
              txProbeDone = true;
              console.warn('MongoDB transactions not available for team recovery; using best-effort path.');
            }
            if (txSupported) throw txErr;
          }
          // Fall through to the best-effort recovery below.
        } finally {
          session.endSession();
        }
      }

      if (!team) {
        // Fallback (no transactions): re-check right before creating, then
        // AGAIN right after, and prefer whichever team actually has the
        // student as a real (2+) member if both exist.
        team = await findTeamForStudent(eventId, student._id);
        if (!team) {
          team = await exports.createTeamForRegistration({ event, leaderStudent: student });
          // A real team may have formed concurrently while we created — if so,
          // discard the stray solo team we just made and use the real one.
          const maybeTeams = isDbConnected()
            ? await Team.find({
                event: eventId,
                _id: { $ne: team._id },
                'members.student': student._id,
                $expr: { $gt: [{ $size: '$members' }, 1] }
              })
            : mockStore.teams.filter(t =>
                String(t.event) === String(eventId) &&
                String(t._id) !== String(team._id) &&
                (t.members || []).some(m => String(m.student) === String(student._id)) &&
                (t.members || []).length > 1
              );
          const maybeReal = (Array.isArray(maybeTeams) ? maybeTeams[0] : null);
          if (maybeReal) {
            if (isDbConnected()) {
              await Team.deleteOne({ _id: team._id });
            } else {
              const idx = mockStore.teams.findIndex(t => String(t._id) === String(team._id));
              if (idx !== -1) mockStore.teams.splice(idx, 1);
            }
            team = maybeReal;
          }
        }
      }
    }
    const full = await fetchTeamForResponse(team);
    return res.status(200).json({ success: true, team: serializeTeam(full, event) });
  } catch (error) {
    console.error('My team error:', error);
    res.status(500).json({ success: false, message: 'Error loading your team' });
  }
};

// ---- Available teammates ---------------------------------------------------------

exports.getAvailableTeammates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id || req.user._id;

    const student = isDbConnected()
      ? await Student.findOne({ user: userId })
      : mockStore.students.find(s => String(s.user) === String(userId));
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const registered = await isStudentRegisteredForEvent(student._id, eventId);
    if (!registered) return res.status(403).json({ success: false, message: 'You must register for this event before browsing teammates.' });

    const qCollege = student.collegeName || '';
    const qYear = norm(student.year || '');

    // Students already committed to ANY OTHER team for this event are excluded.
    // A solo team (the auto-created seat with only the leader) still counts as
    // available — those leaders can be recruited to join another squad.
    const takenIds = new Set();
    let allTeams = [];
    if (isDbConnected()) {
      allTeams = await Team.find({ event: eventId }).select('leader members').lean();
    } else {
      allTeams = mockStore.teams.filter(t => String(t.event) === String(eventId));
    }
    allTeams.forEach(t => {
      const members = t.members || [];
      if (members.length <= 1) return; // solo seat — leader is still available
      if (t.leader) takenIds.add(String(t.leader));
      members.forEach(m => takenIds.add(String(m.student)));
    });

    let candidates = [];
    if (isDbConnected()) {
      const regs = await Registration.find({ event: eventId, status: { $ne: 'Cancelled' } })
        .populate({ path: 'student', populate: { path: 'user', select: 'name' } });
      candidates = regs.map(r => r.student).filter(Boolean);
    } else {
      candidates = mockStore.registrations
        .filter(r => String(r.event) === String(eventId) && r.status !== 'Cancelled')
        .map(r => resolveStudentMock(r.student))
        .filter(Boolean);
    }

    const result = candidates
      .filter(c => String(c._id) !== String(student._id))
      .filter(c => !takenIds.has(String(c._id)))
      .filter(c => !qCollege || collegesMatch(c.collegeName || '', qCollege))
      .filter(c => !qYear || norm(c.year || '') === qYear)
      .map(c => ({
        studentId: String(c._id),
        name: c.user?.name || c.name || c.email || '',
        collegeName: c.collegeName || '',
        department: c.department || '',
        year: c.year || '',
        registerNumber: c.registerNumber || 'N/A'
      }));

    return res.status(200).json({ success: true, count: result.length, students: result });
  } catch (error) {
    console.error('Available teammates error:', error);
    res.status(500).json({ success: false, message: 'Error loading available teammates' });
  }
};

// ---- Add a teammate ----------------------------------------------------------

exports.addTeamMember = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = String(req.body.studentId || '');
    const userId = req.user.id || req.user._id;

    if (!studentId) return res.status(400).json({ success: false, message: 'Select a student to add as a teammate.' });

    const requester = isDbConnected()
      ? await Student.findOne({ user: userId })
      : mockStore.students.find(s => String(s.user) === String(userId));
    if (!requester) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const event = isDbConnected() ? await Event.findById(eventId) : resolveEventMock(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    let team = await findTeamForStudent(eventId, requester._id);
    if (!team) return res.status(403).json({ success: false, message: 'You are not part of a team for this event.' });
    const authed = await assertIsTeamMember(team, userId);
    if (!authed) return res.status(403).json({ success: false, message: 'You are not a member of this team.' });

    // Team size is fixed by the event's own limit — never student-declared.
    const teamLimit = getEffectiveTeamLimit(event);
    // Client-side list is pre-filtered, but the API must not trust that.
    if ((team.members || []).length >= teamLimit) {
      return res.status(400).json({ success: false, code: 'TEAM_MEMBER_LIMIT_REACHED', message: `Team is full (${teamLimit} members).` });
    }

    const teammate = isDbConnected()
      ? await Student.findById(studentId)
      : resolveStudentMock(studentId);
    if (!teammate) return res.status(400).json({ success: false, message: 'Selected student was not found.' });
    if (!collegesMatch(teammate.collegeName || '', requester.collegeName || '')) {
      return res.status(400).json({ success: false, message: `Only students from ${requester.collegeName} can join this team.` });
    }
    if (String(teammate._id) === String(requester._id)) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself.' });
    }
    if ((team.members || []).some(m => String(m.student) === String(teammate._id))) {
      return res.status(400).json({ success: false, message: 'This student is already in the team.' });
    }
    if (await isStudentInAnyTeamForEvent(teammate._id, eventId, team._id)) {
      return res.status(400).json({ success: false, message: 'This student is already on another team for this event.' });
    }
    if (!await isStudentRegisteredForEvent(teammate._id, eventId)) {
      return res.status(400).json({ success: false, message: 'This student has not registered for this event.' });
    }

    // True only when THIS request hit a transient write conflict, so it can
    // continue on the atomic fallback path without permanently disabling txns.
    let hitTransient = false;

    if (isDbConnected() && txSupported) {
      // Transactional add so a concurrent mutual-add can never leave two live
      // teams carrying the same pair of students (TOCTOU race fix).
      try {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          // Fresh in-transaction conflict check: is the teammate already on
          // another team for this event with more than one member?
          const conflict = await Team.findOne({
            event: eventId,
            _id: { $ne: team._id },
            'members.student': teammate._id,
            $expr: { $gt: [{ $size: '$members' }, 1] }
          }).session(session);
          if (conflict) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'This student is already on another team for this event.' });
          }

          // Drop the newcomer's auto-created solo seat FIRST, inside the txn,
          // so the unique (event + member) index accepts the push below.
          await dissolveAbandonedSoloTeam(teammate._id, eventId, team._id, session);

          let updated;
          try {
            updated = await Team.findOneAndUpdate(
              {
                event: eventId,
                _id: team._id,
                'members.student': { $ne: teammate._id },
                $expr: { $lt: [{ $size: '$members' }, teamLimit] }
              },
              { $push: { members: { student: teammate._id, addedAt: new Date() } } },
              { new: true, session }
            );
          } catch (pushErr) {
            // The DB-level unique (event, member) index rejected the push: a
            // concurrent request already placed this student elsewhere.
            await session.abortTransaction();
            if (pushErr.code === 11000) {
              return res.status(400).json({ success: false, message: 'This student is already on another team for this event.' });
            }
            throw pushErr;
          }
          if (!updated) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, code: 'TEAM_MEMBER_LIMIT_REACHED', message: 'Team is full.' });
          }
          team = updated;
          team.status = recomputeStatus(team, event);
          await team.save({ session });

          // Remove ANY other team for this event that now contains the teammate
          // (not just "abandoned solo" ones) — even one that raced to 2+
          // members is dissolved here, and its leftover members are merged into
          // the kept team so nobody silently loses a teammate.
          const staleTeams = await Team.find({
            event: eventId,
            _id: { $ne: team._id },
            'members.student': teammate._id
          }).session(session);

          for (const stale of staleTeams) {
            const otherMembers = (stale.members || []).filter(m => String(m.student) !== String(teammate._id));
            // Delete the stale team FIRST so its (event + member) index entries
            // are freed before its leftover members are merged into our team —
            // otherwise the unique index would reject the merge.
            await Team.deleteOne({ _id: stale._id }).session(session);
            if (otherMembers.length > 0 && (team.members.length + otherMembers.length) <= teamLimit) {
              for (const m of otherMembers) {
                if (!team.members.some(tm => String(tm.student) === String(m.student))) {
                  team.members.push({ student: m.student, addedAt: m.addedAt || new Date() });
                }
              }
              team.status = recomputeStatus(team, event);
              await team.save({ session });
            }
          }

          await session.commitTransaction();
        } catch (txErr) {
          await session.abortTransaction();
          throw txErr;
        } finally {
          session.endSession();
        }
      } catch (txErr) {
        // A transient write conflict is NORMAL when two teams try to add the
        // same student at the same instant — transactions ARE working and one
        // side loses a race. Never treat that as "transactions unsupported";
        // fall through to this request's best-effort atomic+ sweep instead.
        const txKind = classifyTxError(txErr);
        if (txKind === 'transient') {
          // Don't permanently downgrade — but this request DID just lose a
          // race, so run the atomic claim + sweep below to complete the add.
          hitTransient = true;
        } else {
          if (!txProbeDone && txKind === 'unsupported') {
            txSupported = false;
            txProbeDone = true;
            console.warn('MongoDB transactions not available for team adds; using best-effort path.');
          }
          if (txSupported) throw txErr;
        }
        // Fall through to the best-effort branch below.
      }
    }

    if (isDbConnected() && (!txSupported || hitTransient)) {
      // No transactions available (or this request just hit a transient write
      // conflict). Use an atomic claim + broad sweep instead of check-then-act,
      // so a concurrent mutual-add still can't leave duplicates.

      // Step 0: drop the newcomer's auto-created solo seat first, so the unique
      // (event + member) index accepts the atomic claim below.
      await dissolveAbandonedSoloTeam(teammate._id, eventId, team._id);

      // Step 1: atomically add the teammate to THIS team (single atomic write).
      let updated;
      try {
        updated = await Team.findOneAndUpdate(
          {
            event: eventId,
            _id: team._id,
            'members.student': { $ne: teammate._id },
            $expr: { $lt: [{ $size: '$members' }, teamLimit] }
          },
          { $push: { members: { student: teammate._id, addedAt: new Date() } } },
          { new: true }
        );
      } catch (pushErr) {
        // Unique (event + member) index rejected the claim: the student was
        // concurrently placed on another team for this event.
        if (pushErr.code === 11000) {
          return res.status(400).json({ success: false, message: 'This student is already on another team for this event.' });
        }
        throw pushErr;
      }
      if (!updated) {
        return res.status(400).json({ success: false, code: 'TEAM_MEMBER_LIMIT_REACHED', message: 'Team is full.' });
      }
      team = updated;
      team.status = recomputeStatus(team, event);
      await team.save();

      // Step 2: sweep for ANY other team (not just size <= 1) that now also
      // contains the teammate, and resolve the conflict deterministically:
      // the team with the LOWER _id (i.e. created first) wins and keeps the
      // student; every later team gets the student pulled back out.
      const staleTeams = await Team.find({
        event: eventId,
        _id: { $ne: team._id },
        'members.student': teammate._id
      });

      for (const stale of staleTeams) {
        const teamIsOlder = String(team._id) < String(stale._id) ||
          (team.createdAt && stale.createdAt && new Date(team.createdAt) < new Date(stale.createdAt));

        if (teamIsOlder || (stale.members || []).length <= 1) {
          // Our team keeps the student; remove them from (or delete) the stale one.
          const remaining = (stale.members || []).filter(m => String(m.student) !== String(teammate._id));
          if (remaining.length === 0) {
            await Team.deleteOne({ _id: stale._id });
          } else {
            await Team.updateOne({ _id: stale._id }, { $set: { members: remaining } });
          }
        } else {
          // The other team is older and has other members — it wins the race.
          // Pull the teammate back out of OUR team instead, so they end up in
          // exactly one place (the older team), and re-fetch it as the result.
          team.members = team.members.filter(m => String(m.student) !== String(teammate._id));
          team.status = recomputeStatus(team, event);
          await team.save();
          team = stale;
        }
      }
    }

    if (!isDbConnected()) {
      if ((team.members || []).length >= teamLimit) {
        return res.status(400).json({ success: false, code: 'TEAM_MEMBER_LIMIT_REACHED', message: 'Team is full.' });
      }
      team.members.push({ student: teammate._id, addedAt: new Date().toISOString() });
      team.status = recomputeStatus(team, event);
    }

    // The newcomer was auto-holding their own solo seat from registration;
    // dissolve it so they are tracked by exactly one team for this event.
    await dissolveAbandonedSoloTeam(teammate._id, eventId, team._id);

    const full = await fetchTeamForResponse(team);
    return res.status(200).json({ success: true, message: 'Teammate added.', team: serializeTeam(full, event) });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ success: false, message: 'Error adding teammate' });
  }
};

// ---- Remove a teammate -------------------------------------------------------

exports.removeTeamMember = async (req, res) => {
  try {
    const { eventId, studentId } = req.params;
    const userId = req.user.id || req.user._id;

    const requester = isDbConnected()
      ? await Student.findOne({ user: userId })
      : mockStore.students.find(s => String(s.user) === String(userId));
    if (!requester) return res.status(404).json({ success: false, message: 'Student profile not found' });

    const event = isDbConnected() ? await Event.findById(eventId) : resolveEventMock(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    let team = await findTeamForStudent(eventId, requester._id);
    if (!team) return res.status(403).json({ success: false, message: 'You are not part of a team for this event.' });
    const authed = await assertIsTeamMember(team, userId);
    if (!authed) return res.status(403).json({ success: false, message: 'You are not a member of this team.' });

    const members = (team.members || []).slice();
    const targetMember = members.find(m => String(m.student) === String(studentId));
    if (!targetMember) return res.status(404).json({ success: false, message: 'That member is not in this team.' });

    // A team must always keep at least one member.
    if (members.length <= 1) {
      return res.status(400).json({ success: false, message: 'A team must always have at least one member.' });
    }

    team.members = members.filter(m => String(m.student) !== String(studentId));

    // The `leader` field is just the tracked creator id (used for the unique
    // index); if the created left, re-point it at the oldest remaining member.
    if (String(team.leader) === String(studentId)) {
      const oldest = [...team.members]
        .sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0))[0];
      team.leader = oldest.student;
    }

    team.status = recomputeStatus(team, event);
    if (isDbConnected()) await team.save();

    const full = await fetchTeamForResponse(team);
    return res.status(200).json({ success: true, message: 'Member removed.', team: serializeTeam(full, event) });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ success: false, message: 'Error removing teammate' });
  }
};

// ---- Cleanup on student deletion ---------------------------------------------
// When a Student record is deleted (admin action), any Team referencing that
// student must be cleaned up too -- otherwise a permanently-deleted student's
// id is left stuck inside team.members / team.leader forever, with no way to
// remove it through the normal (session-authorized) team routes since the
// student it would authenticate as no longer exists.
exports.removeStudentFromAllTeams = async (studentId, session) => {
  if (isDbConnected()) {
    const resTeams = await Team.find({ 'members.student': studentId }, null, session ? { session } : undefined);
    for (const resTeam of resTeams) {
      resTeam.members = (resTeam.members || []).filter(m => String(m.student) !== String(studentId));

      if (resTeam.members.length === 0) {
        // No members left at all -- nothing meaningful to keep.
        await Team.deleteOne({ _id: resTeam._id }, session ? { session } : undefined);
        continue;
      }

      if (String(resTeam.leader) === String(studentId)) {
        // Re-point the internal leader/creator reference at the oldest
        // remaining member, same rule used in removeTeamMember.
        const oldestRes = [...resTeam.members].sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0))[0];
        resTeam.leader = oldestRes.student;
      }

      const event = await Event.findById(resTeam.event).session(session || null);
      resTeam.status = recomputeStatus(resTeam, event);
      await (session ? resTeam.save({ session }) : resTeam.save());
    }
  } else {
    const remaining = [];
    for (const team of mockStore.teams) {
      team.members = (team.members || []).filter(m => String(m.student) !== String(studentId));
      if (team.members.length === 0) continue; // drop empty teams
      if (String(team.leader) === String(studentId)) {
        const oldest = [...team.members].sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0))[0];
        team.leader = oldest.student;
      }
      const event = resolveEventMock(team.event);
      team.status = recomputeStatus(team, event);
      remaining.push(team);
    }
    mockStore.teams = remaining;
  }
};

// ---- Shared helpers for event registration --------------------------------------

exports.getEffectiveTeamLimit = getEffectiveTeamLimit;
exports.recomputeStatus = recomputeStatus;
exports.isStudentRegisteredForEvent = isStudentRegisteredForEvent;
exports.isStudentInAnyTeamForEvent = isStudentInAnyTeamForEvent;