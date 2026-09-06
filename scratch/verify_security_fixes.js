const assert = require('assert');
const { sanitizeUser } = require('../backend/utils/sanitizeUser');
const adminController = require('../backend/controllers/adminController');
const authController = require('../backend/controllers/authController');
const announcementController = require('../backend/controllers/announcementController');
const mockStore = require('../backend/utils/mockStore');

console.log('=== STARTING SECURITY & INTEGRITY VERIFICATION ===');

// Test 1: sanitizeUser utility
const rawUser = {
  _id: 'u123',
  name: 'Test Volunteer',
  email: 'vol@example.com',
  password: '$2b$10$encryptedpasswordhash12345',
  resetPasswordToken: 'token123',
  resetPasswordExpire: 1234567,
  __v: 0,
  role: 'volunteer'
};
const clean = sanitizeUser(rawUser);
assert.strictEqual(clean.password, undefined, 'Password must be removed');
assert.strictEqual(clean.resetPasswordToken, undefined, 'resetPasswordToken must be removed');
assert.strictEqual(clean.resetPasswordExpire, undefined, 'resetPasswordExpire must be removed');
assert.strictEqual(clean.__v, undefined, '__v must be removed');
assert.strictEqual(clean.name, 'Test Volunteer');
assert.strictEqual(clean.role, 'volunteer');
console.log('✔ Test 1: sanitizeUser correctly strips sensitive fields');

// Test helper for mock response
const mockResCreator = () => ({
  statusCode: 200,
  data: null,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; }
});

(async () => {
  // Test createStaff
  const res1 = mockResCreator();
  await adminController.createStaff({
    body: { name: 'Staff A', email: 'staffa@symposium.com', password: 'secretpassword', role: 'coordinator' }
  }, res1);

  assert.strictEqual(res1.statusCode, 201);
  assert.strictEqual(res1.data.success, true);
  assert.strictEqual(res1.data.user.password, undefined, 'createStaff must NOT return password');
  console.log('✔ Test 2: createStaff returns sanitized user without password hash');

  // Test getStaffList
  const res2 = mockResCreator();
  await adminController.getStaffList({}, res2);
  assert.strictEqual(res2.statusCode, 200);
  assert(res2.data.staff.length > 0);
  res2.data.staff.forEach(s => {
    assert.strictEqual(s.password, undefined, 'getStaffList must NOT contain password in any staff item');
  });
  console.log('✔ Test 3: getStaffList returns all staff with password hashes stripped');

  // Test getMe
  const res3 = mockResCreator();
  await authController.getMe({
    user: { id: mockStore.users[0]._id }
  }, res3);
  assert.strictEqual(res3.statusCode, 200);
  assert.strictEqual(res3.data.user.password, undefined, 'getMe must NOT return password');
  console.log('✔ Test 4: getMe returns sanitized user');

  // Test Announcement validation (Empty Title)
  const res4 = mockResCreator();
  await announcementController.createAnnouncement({
    body: { title: '   ', content: 'Valid content' }
  }, res4);
  assert.strictEqual(res4.statusCode, 400);
  assert.strictEqual(res4.data.success, false);
  console.log('✔ Test 5: createAnnouncement rejects whitespace-only / empty title with 400');

  // Test Announcement validation (Empty Content)
  const res5 = mockResCreator();
  await announcementController.createAnnouncement({
    body: { title: 'Valid Title', content: '' }
  }, res5);
  assert.strictEqual(res5.statusCode, 400);
  assert.strictEqual(res5.data.success, false);
  console.log('✔ Test 6: createAnnouncement rejects empty content with 400');

  // Test Announcement creation with valid input
  const res6 = mockResCreator();
  await announcementController.createAnnouncement({
    body: { title: 'Important Bus Schedule Update', content: 'Bus will arrive at 8:00 AM', category: 'Schedule Change', priority: 'High' },
    user: { name: 'Admin Test' }
  }, res6);
  assert.strictEqual(res6.statusCode, 201);
  assert.strictEqual(res6.data.announcement.title, 'Important Bus Schedule Update');
  assert.strictEqual(res6.data.announcement.category, 'Schedule Change');
  assert.strictEqual(res6.data.announcement.priority, 'High');
  console.log('✔ Test 7: createAnnouncement successfully publishes valid announcement');

  // Setup a test student in mockStore for status testing
  const testStudent = {
    _id: 's_test_101',
    user: 'u_test_101',
    symposiumCode: 'DV2026-REG-999999',
    registerNumber: '810023104999',
    collegeName: 'Test Engineering College',
    department: 'CSE',
    year: 'III',
    email: 'teststudent@example.com',
    phone: '9876543210',
    verificationStatus: 'Pending',
    isCheckedIn: false,
    qrCodeData: 'data:image/png;base64,mockqrdata'
  };
  mockStore.students.push(testStudent);

  // Test updateStudentStatus with invalid status (Mutate-before-validate test)
  const targetStudent = mockStore.students.find(s => s._id === 's_test_101');
  const originalStatus = targetStudent.verificationStatus;

  const res7 = mockResCreator();
  await adminController.updateStudentStatus({
    params: { id: targetStudent._id },
    body: { status: 'INVALID_GARBAGE_STATUS' }
  }, res7);
  assert.strictEqual(res7.statusCode, 400);
  assert.strictEqual(targetStudent.verificationStatus, originalStatus, 'Student verificationStatus must NOT be mutated on invalid input');
  console.log('✔ Test 8: updateStudentStatus rejects invalid status with 400 and does NOT corrupt student data');

  // Test updateStudentStatus with undefined status
  const res8 = mockResCreator();
  await adminController.updateStudentStatus({
    params: { id: targetStudent._id },
    body: {}
  }, res8);
  assert.strictEqual(res8.statusCode, 400);
  assert.strictEqual(targetStudent.verificationStatus, originalStatus, 'Student verificationStatus must NOT be set to undefined');
  console.log('✔ Test 9: updateStudentStatus handles undefined status gracefully without crashing or mutating data');

  // Test updateStudentStatus with valid status 'Approved'
  const res9 = mockResCreator();
  await adminController.updateStudentStatus({
    params: { id: targetStudent._id },
    body: { status: 'Approved' }
  }, res9);
  assert.strictEqual(res9.statusCode, 200);
  assert.strictEqual(targetStudent.verificationStatus, 'Approved');
  assert.strictEqual(targetStudent.symposiumCode, 'DV2026-REG-999999', 'Symposium code must be unchanged');
  assert.strictEqual(targetStudent.qrCodeData, 'data:image/png;base64,mockqrdata', 'QR Code data must be unchanged');
  console.log('✔ Test 10: updateStudentStatus successfully approves valid status without changing symposium codes or QR data');

  console.log('\n🎉 ALL 10 TESTS PASSED SUCCESSFULLY! ZERO DATA CORRUPTION OR LEAKS!');
})();
