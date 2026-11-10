import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMembershipNumber,
  parseMembershipNumber,
  generateQrPayload,
  verifyQrPayload,
  validateAttendanceAttempt,
  calculateAttendanceMetrics,
  formatGhanaPhoneNumber
} from './attendanceLogic';

test('formatMembershipNumber generates consistent zero-padded IDs', () => {
  assert.equal(formatMembershipNumber(1), 'MYC-000001');
  assert.equal(formatMembershipNumber(125), 'MYC-000125');
  assert.equal(formatMembershipNumber(99999), 'MYC-099999');
  assert.equal(formatMembershipNumber(125, 'MCG'), 'MCG-000125');
});

test('parseMembershipNumber correctly parses sequence numbers', () => {
  assert.equal(parseMembershipNumber('MYC-000125'), 125);
  assert.equal(parseMembershipNumber('myc-000001'), 1);
  assert.equal(parseMembershipNumber('MCG-00125'), 125);
  assert.equal(parseMembershipNumber('invalid'), null);
});

test('generateQrPayload and verifyQrPayload validate genuine cards', () => {
  const memberId = 'uuid-member-123';
  const membershipNumber = 'MYC-000042';
  const payload = generateQrPayload(memberId, membershipNumber);

  assert.ok(payload.startsWith('MYC:v1:'));
  
  // Verification passes
  const verification = verifyQrPayload(payload);
  assert.equal(verification.isValid, true);
  assert.equal(verification.memberId, memberId);
  assert.equal(verification.membershipNumber, membershipNumber);

  // Tampered payload fails
  const tampered = payload.replace(membershipNumber, 'MYC-000043');
  const tamperedResult = verifyQrPayload(tampered);
  assert.equal(tamperedResult.isValid, false);
  assert.match(tamperedResult.error || '', /mismatch/i);

  // Direct membership number fallback
  const directResult = verifyQrPayload('MYC-000125');
  assert.equal(directResult.isValid, true);
  assert.equal(directResult.membershipNumber, 'MYC-000125');
});

test('validateAttendanceAttempt prevents duplicate attendance and inactive sessions', () => {
  const existingSet = new Set<string>();
  existingSet.add('session-1:member-100');

  // Active session, new member -> allowed
  const validAttempt = validateAttendanceAttempt({
    sessionId: 'session-1',
    memberId: 'member-101',
    sessionStatus: 'active',
    existingRecordSessionMemberIds: existingSet
  });
  assert.equal(validAttempt.isValid, true);

  // Active session, duplicate member -> rejected
  const duplicateAttempt = validateAttendanceAttempt({
    sessionId: 'session-1',
    memberId: 'member-100',
    sessionStatus: 'active',
    existingRecordSessionMemberIds: existingSet
  });
  assert.equal(duplicateAttempt.isValid, false);
  assert.match(duplicateAttempt.error || '', /already recorded/i);

  // Inactive/scheduled session -> rejected
  const scheduledAttempt = validateAttendanceAttempt({
    sessionId: 'session-2',
    memberId: 'member-102',
    sessionStatus: 'scheduled',
    existingRecordSessionMemberIds: existingSet
  });
  assert.equal(scheduledAttempt.isValid, false);
  assert.match(scheduledAttempt.error || '', /scheduled/i);
});

test('calculateAttendanceMetrics computes correct totals and percentages', () => {
  const metrics = calculateAttendanceMetrics({
    totalRegisteredMembers: 100,
    presentMemberCount: 75,
    visitorCount: 10,
    walkInCount: 5
  });

  assert.equal(metrics.totalRegisteredMembers, 100);
  assert.equal(metrics.presentMemberCount, 75);
  assert.equal(metrics.totalAttendance, 90);
  assert.equal(metrics.attendanceRate, 75);
});

test('formatGhanaPhoneNumber validates and formats telephone numbers', () => {
  const test1 = formatGhanaPhoneNumber('0241234567');
  assert.equal(test1.isValid, true);
  assert.equal(test1.formatted, '024 123 4567');

  const test2 = formatGhanaPhoneNumber('+233241234567');
  assert.equal(test2.isValid, true);
  assert.equal(test2.formatted, '024 123 4567');

  const test3 = formatGhanaPhoneNumber('invalid');
  assert.equal(test3.isValid, false);
});
