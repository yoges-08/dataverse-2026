const assert = require('assert');
const { collegesMatch, isHostCollege } = require('../backend/utils/collegeMatch');

console.log('=== VERIFYING COLLEGE MATCHER & HOST COLLEGE ACCURACY ===');

// 1. Dr. Mahalingam College (MCET, Pollachi) vs AAMEC (Kovilvenni) - MUST BE FALSE
const mcetVsAamec = collegesMatch(
  'Mahalingam College of Engineering and Technology',
  'Anjalai Ammal Mahalingam Engineering College'
);
assert.strictEqual(mcetVsAamec, false, 'MCET Pollachi must NOT match AAMEC Kovilvenni');
console.log('✔ Test 1: MCET Pollachi vs AAMEC Kovilvenni -> FALSE (Exploit closed)');

const mcetFullVsAamec = collegesMatch(
  'Dr. Mahalingam College of Engineering and Technology',
  'Anjalai Ammal Mahalingam Engineering College'
);
assert.strictEqual(mcetFullVsAamec, false, 'Dr. MCET Pollachi must NOT match AAMEC Kovilvenni');
console.log('✔ Test 2: Dr. MCET Pollachi vs AAMEC Kovilvenni -> FALSE');

// 2. isHostCollege checks
assert.strictEqual(isHostCollege('Mahalingam College of Engineering and Technology'), false);
console.log('✔ Test 3: isHostCollege("Mahalingam College of Engineering and Technology") -> FALSE');

assert.strictEqual(isHostCollege('Anjalai College'), false);
console.log('✔ Test 4: isHostCollege("Anjalai College") -> FALSE');

assert.strictEqual(isHostCollege('Anjalai Ammal Mahalingam Engineering College'), true);
console.log('✔ Test 5: isHostCollege("Anjalai Ammal Mahalingam Engineering College") -> TRUE');

assert.strictEqual(isHostCollege('Anjalai Ammal Mahalingam Engineering College Kovilvenni'), true);
console.log('✔ Test 6: isHostCollege("Anjalai Ammal Mahalingam Engineering College Kovilvenni") -> TRUE');

assert.strictEqual(isHostCollege('AAMEC'), true);
console.log('✔ Test 7: isHostCollege("AAMEC") -> TRUE');

assert.strictEqual(isHostCollege('AAMEC Kovilvenni'), true);
console.log('✔ Test 8: isHostCollege("AAMEC Kovilvenni") -> TRUE');

// 3. Legitimate college pairs must continue to match
assert.strictEqual(
  collegesMatch('Kings College of Engineering', 'Kings College of Engineering Punalkulam'),
  true,
  'Kings College with campus suffix should match'
);
console.log('✔ Test 9: Kings College vs Kings College Punalkulam -> TRUE');

assert.strictEqual(
  collegesMatch('J J Engineering', 'J J Engineering College'),
  true,
  'J J Engineering vs J J Engineering College should match'
);
console.log('✔ Test 10: J J Engineering vs J J Engineering College -> TRUE');

assert.strictEqual(
  collegesMatch('Anjalai Ammal Mahalingam Engineering College', 'Anjalai Ammal Mahalingam Engineering College Kovilvenni'),
  true,
  'Host college with campus suffix should match'
);
console.log('✔ Test 11: AAMEC vs AAMEC Kovilvenni -> TRUE');

assert.strictEqual(
  collegesMatch('AAMEC', 'Anjalai Ammal Mahalingam Engineering College'),
  true,
  'Acronym AAMEC vs spelled out name should match'
);
console.log('✔ Test 12: AAMEC vs Full Name -> TRUE');

assert.strictEqual(
  collegesMatch('ABC Engineering College', 'XYZ Engineering'),
  false,
  'Unrelated colleges must not match'
);
console.log('✔ Test 13: ABC vs XYZ -> FALSE');

console.log('\n🎉 ALL 13 COLLEGE MATCHER TESTS PASSED WITH 100% SUCCESS!');
