process.env.JWT_SECRET = 'test_jwt_secret_dataverse_2026_super_secure';
const assert = require('assert');
const jwt = require('jsonwebtoken');
const authController = require('../backend/controllers/authController');
const feedbackController = require('../backend/controllers/feedbackController');
const { protect, authorize } = require('../backend/middleware/auth');
const mockStore = require('../backend/utils/mockStore');

console.log('=== STARTING 4-FIX VERIFICATION TEST SUITE ===');

const mockRes = () => ({
  statusCode: 200,
  data: null,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; }
});

(async () => {
  // --- Test Fix 1: registerStudent Feature Flag ---
  // Default (closed):
  process.env.REGISTRATIONS_CLOSED = 'true';
  const res1 = mockRes();
  await authController.registerStudent({ body: {} }, res1);
  assert.strictEqual(res1.statusCode, 403);
  assert(res1.data.message.includes('closed'));
  console.log('✔ Test 1.1: registerStudent returns 403 when REGISTRATIONS_CLOSED=true');

  // Open (REGISTRATIONS_CLOSED=false):
  process.env.REGISTRATIONS_CLOSED = 'false';
  const res2 = mockRes();
  await authController.registerStudent({ body: {} }, res2);
  // Reaches body validation and returns 400 instead of 403
  assert.strictEqual(res2.statusCode, 400);
  assert.strictEqual(res2.data.message, 'Please fill all required registration fields');
  console.log('✔ Test 1.2: registerStudent proceeds to active logic when REGISTRATIONS_CLOSED=false');
  // Reset back to closed
  process.env.REGISTRATIONS_CLOSED = 'true';

  // --- Test Fix 2: Auth Middleware Case-Insensitive Bearer Token ---
  const superAdminUser = mockStore.users.find(u => u.role === 'super_admin') || {
    _id: 'u1',
    name: 'Admin Test',
    email: 'admin@test.com',
    role: 'super_admin'
  };
  const token = jwt.sign({ id: superAdminUser._id }, process.env.JWT_SECRET);

  // Standard "Bearer <token>"
  let nextCalled = false;
  const reqStandard = { headers: { authorization: `Bearer ${token}` } };
  const resAuth1 = mockRes();
  await protect(reqStandard, resAuth1, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Standard Bearer token should pass');
  console.log('✔ Test 2.1: protect passes standard "Bearer <token>"');

  // Lowercase "bearer <token>"
  nextCalled = false;
  const reqLower = { headers: { authorization: `bearer ${token}` } };
  const resAuth2 = mockRes();
  await protect(reqLower, resAuth2, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Lowercase bearer token should pass');
  console.log('✔ Test 2.2: protect passes lowercase "bearer <token>"');

  // Extra whitespace "Bearer    <token>"
  nextCalled = false;
  const reqSpaces = { headers: { authorization: `Bearer    ${token}` } };
  const resAuth3 = mockRes();
  await protect(reqSpaces, resAuth3, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Bearer token with multiple spaces should pass');
  console.log('✔ Test 2.3: protect passes "Bearer   <token>" with multiple spaces');

  // Missing token
  const reqNoToken = { headers: {} };
  const resAuth4 = mockRes();
  await protect(reqNoToken, resAuth4, () => {});
  assert.strictEqual(resAuth4.statusCode, 401);
  assert.strictEqual(resAuth4.data.message, 'Not authorized to access this route');
  console.log('✔ Test 2.4: protect safely rejects missing token with 401');

  // --- Test Fix 3: Admin Feedback Endpoints in Admin Router ---
  const adminRoutes = require('../backend/routes/adminRoutes');
  assert(adminRoutes.stack.some(layer => layer.route && layer.route.path === '/feedback'), 'adminRoutes must have /feedback route');
  assert(adminRoutes.stack.some(layer => layer.route && layer.route.path === '/feedback/export'), 'adminRoutes must have /feedback/export route');
  assert(adminRoutes.stack.some(layer => layer.route && layer.route.path === '/feedback/:id'), 'adminRoutes must have /feedback/:id route');
  console.log('✔ Test 3.1: adminRoutes cleanly handles /feedback, /feedback/export, and /feedback/:id');

  // --- Test Fix 4: Feedback Public Routes in Feedback Router ---
  const feedbackRoutes = require('../backend/routes/feedbackRoutes');
  assert(feedbackRoutes.stack.some(layer => layer.route && layer.route.path === '/check'), 'feedbackRoutes must have /check route');
  assert(feedbackRoutes.stack.some(layer => layer.route && layer.route.path === '/'), 'feedbackRoutes must have / route');
  console.log('✔ Test 3.2: feedbackRoutes cleanly handles /check and / public endpoints');

  console.log('\n🎉 ALL 4 ISSUES VERIFIED AND RESOLVED WITH 100% SUCCESS!');
})();
