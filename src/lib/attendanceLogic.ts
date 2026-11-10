/**
 * Core pure business logic for Methodist Church Ghana - MYC Attendance System.
 * Pure functions decoupled from React and DOM for high reliability and testability.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AttendanceAttempt {
  sessionId: string;
  memberId?: string;
  visitorId?: string;
  sessionStatus: 'scheduled' | 'active' | 'completed' | 'cancelled';
  existingRecordSessionMemberIds: Set<string>; // key: `${sessionId}:${memberId}`
}

/**
 * Format a zero-padded membership number e.g. MYC-000001
 */
export function formatMembershipNumber(sequenceNumber: number, prefix: string = 'MYC'): string {
  if (sequenceNumber < 1) {
    throw new Error('Sequence number must be a positive integer');
  }
  const padded = String(Math.floor(sequenceNumber)).padStart(6, '0');
  return `${prefix}-${padded}`;
}

/**
 * Parses sequence number from a membership number like MYC-000125 -> 125
 */
export function parseMembershipNumber(membershipNumber: string): number | null {
  if (!membershipNumber) return null;
  const match = membershipNumber.trim().toUpperCase().match(/^(?:MYC|MCG)-?(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

/**
 * Creates a secure QR credential payload
 * Format: MYC:v1:<memberId>:<membershipNumber>:<checksum>
 */
export function generateQrPayload(memberId: string, membershipNumber: string, salt: string = 'MCG-MYC-2026'): string {
  if (!memberId || !membershipNumber) {
    throw new Error('memberId and membershipNumber are required');
  }
  // Deterministic 8-character hex checksum from memberId + membershipNumber + salt
  const str = `${memberId}:${membershipNumber}:${salt}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const checksum = Math.abs(hash).toString(16).padStart(8, '0');
  return `MYC:v1:${memberId}:${membershipNumber}:${checksum}`;
}

/**
 * Verifies and parses a scanned QR payload
 */
export function verifyQrPayload(payload: string, salt: string = 'MCG-MYC-2026'): {
  isValid: boolean;
  memberId?: string;
  membershipNumber?: string;
  error?: string;
} {
  if (!payload || typeof payload !== 'string') {
    return { isValid: false, error: 'Empty or invalid QR code' };
  }

  const parts = payload.trim().split(':');
  // Format check: MYC:v1:<memberId>:<membershipNumber>:<checksum>
  if (parts.length === 5 && parts[0] === 'MYC' && parts[1] === 'v1') {
    const [, , memberId, membershipNumber, checksum] = parts;
    const expected = generateQrPayload(memberId, membershipNumber, salt);
    if (payload.trim() === expected) {
      return { isValid: true, memberId, membershipNumber };
    }
    return { isValid: false, error: 'QR credential checksum mismatch or tampered' };
  }

  // Backward compatible or direct membership number check e.g. "MYC-000125" or "MCG-00125"
  if (/^(?:MYC|MCG)-?\d+$/i.test(payload.trim())) {
    return {
      isValid: true,
      membershipNumber: payload.trim().toUpperCase()
    };
  }

  return { isValid: false, error: 'Unrecognized QR code format. Not an official MYC card.' };
}

/**
 * Validates whether an attendance record can be recorded for an active session
 */
export function validateAttendanceAttempt(attempt: AttendanceAttempt): ValidationResult {
  if (attempt.sessionStatus !== 'active') {
    return {
      isValid: false,
      error: `Cannot record attendance. Meeting session is currently '${attempt.sessionStatus}', but must be 'active'.`
    };
  }

  if (!attempt.memberId && !attempt.visitorId) {
    return {
      isValid: false,
      error: 'Either member ID or visitor ID must be provided'
    };
  }

  if (attempt.memberId) {
    const key = `${attempt.sessionId}:${attempt.memberId}`;
    if (attempt.existingRecordSessionMemberIds.has(key)) {
      return {
        isValid: false,
        error: 'Attendance already recorded for this member in the current session'
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculates session attendance metrics
 */
export function calculateAttendanceMetrics(params: {
  totalRegisteredMembers: number;
  presentMemberCount: number;
  visitorCount: number;
  walkInCount: number;
}) {
  const { totalRegisteredMembers, presentMemberCount, visitorCount, walkInCount } = params;
  const totalAttendance = presentMemberCount + visitorCount + walkInCount;
  const attendanceRate = totalRegisteredMembers > 0
    ? Math.round((presentMemberCount / totalRegisteredMembers) * 100)
    : 0;

  return {
    totalRegisteredMembers,
    presentMemberCount,
    visitorCount,
    walkInCount,
    totalAttendance,
    attendanceRate
  };
}

/**
 * Ghana phone number validator and normalizer
 * Accepts e.g. 0241234567, 024 123 4567, +233241234567, +233 24 123 4567
 */
export function formatGhanaPhoneNumber(phone: string): { isValid: boolean; formatted: string } {
  if (!phone) return { isValid: false, formatted: '' };
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Format starting with 0 followed by 9 digits (total 10 digits e.g. 0241234567)
  if (/^0[235][0-9]{8}$/.test(cleaned)) {
    // format as 024 123 4567
    const formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return { isValid: true, formatted };
  }

  // Format starting with +233
  if (/^\+233[235][0-9]{8}$/.test(cleaned)) {
    const local = '0' + cleaned.slice(4);
    const formatted = `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
    return { isValid: true, formatted };
  }

  // Allow general valid standard phone format if international or landline
  if (/^[0-9+]{8,15}$/.test(cleaned)) {
    return { isValid: true, formatted: phone.trim() };
  }

  return { isValid: false, formatted: phone.trim() };
}
