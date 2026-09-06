const assert = require('assert');
const eventController = require('../backend/controllers/eventController');
const mockStore = require('../backend/utils/mockStore');

console.log('=== VERIFYING EVENT ID COLLISION & NUMERIC TYPE FIXES ===');

const mockRes = () => ({
  statusCode: 200,
  data: null,
  status(code) { this.statusCode = code; return this; },
  json(data) { this.data = data; return this; }
});

(async () => {
  // Check initial state
  const initialEventCount = mockStore.events.length;
  const initialCodeSprint = mockStore.events.find(e => e._id === 'e9');
  const initialBugHunt = mockStore.events.find(e => e._id === 'e8');
  assert(initialCodeSprint, 'e9 Code Sprint must exist in initial seed');
  assert(initialBugHunt, 'e8 Bug Hunt must exist in initial seed');
  console.log(`✔ Initial state: ${initialEventCount} seeded events (including e8 and e9)`);

  // Test 1: Create first new event with string numeric inputs (multipart form simulation)
  const res1 = mockRes();
  await eventController.createEvent({
    body: {
      title: 'Prompt Battle 2026',
      category: 'Technical',
      maxParticipants: '75', // string from multipart
      teamLimit: '3',        // string from multipart
      requiresLanguageChoice: 'true'
    }
  }, res1);

  assert.strictEqual(res1.statusCode, 201);
  assert.strictEqual(res1.data.event._id, 'e10', 'First created event MUST get ID e10 (NOT e9!)');
  assert.strictEqual(typeof res1.data.event.maxParticipants, 'number', 'maxParticipants must be a number');
  assert.strictEqual(res1.data.event.maxParticipants, 75);
  assert.strictEqual(typeof res1.data.event.teamLimit, 'number', 'teamLimit must be a number');
  assert.strictEqual(res1.data.event.teamLimit, 3);
  assert.strictEqual(res1.data.event.requiresLanguageChoice, true, 'requiresLanguageChoice must be boolean true');
  console.log('✔ Test 1: First new event created with non-colliding ID e10 and proper numeric types');

  // Verify e9 Code Sprint was NOT corrupted or overwritten
  const checkCodeSprint = mockStore.events.find(e => e._id === 'e9');
  assert.strictEqual(checkCodeSprint.title, 'Code Sprint', 'e9 Code Sprint must remain untouched');
  console.log('✔ Test 2: Pre-seeded event e9 (Code Sprint) remains intact and distinct');

  // Test 2: Create second new event
  const res2 = mockRes();
  await eventController.createEvent({
    body: {
      title: 'Web Design Clash',
      category: 'Technical',
      maxParticipants: 50,
      teamLimit: 2
    }
  }, res2);
  assert.strictEqual(res2.statusCode, 201);
  assert.strictEqual(res2.data.event._id, 'e11', 'Second created event MUST get ID e11');
  console.log('✔ Test 3: Second new event created with non-colliding ID e11');

  // Test 3: Delete e10
  const res3 = mockRes();
  await eventController.deleteEvent({ params: { id: 'e10' } }, res3);
  assert.strictEqual(res3.statusCode, 200);
  assert.strictEqual(mockStore.events.some(e => e._id === 'e10'), false, 'e10 should be deleted');
  assert.strictEqual(mockStore.events.some(e => e._id === 'e9'), true, 'e9 Code Sprint must NOT be deleted');
  assert.strictEqual(mockStore.events.some(e => e._id === 'e11'), true, 'e11 Web Design Clash must NOT be deleted');
  console.log('✔ Test 4: Deleting e10 cleanly removes e10 without affecting e9 or e11');

  // Test 4: Create third event after deletion
  const res4 = mockRes();
  await eventController.createEvent({
    body: {
      title: 'UI/UX Odyssey',
      category: 'Non-Technical',
      maxParticipants: 40,
      teamLimit: 1
    }
  }, res4);
  assert.strictEqual(res4.statusCode, 201);
  assert.strictEqual(res4.data.event._id, 'e12', 'Third event after deletion must get e12');
  console.log('✔ Test 5: New event created after deletion gets e12 with zero collision');

  // Cleanup test events from mockStore
  mockStore.events = mockStore.events.filter(e => !['e10', 'e11', 'e12'].includes(e._id));
  console.log('\n🎉 ALL EVENT ID COLLISION AND NUMERIC TYPE TESTS PASSED 100%!');
})();
