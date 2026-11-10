export type UserRole = 'admin' | 'attendance_officer';

export type ActivityType =
  | 'Sunday Service'
  | 'MYC Meeting'
  | 'Youth Fellowship'
  | 'Bible Study'
  | 'Prayer Meeting'
  | 'Choir Rehearsal'
  | 'Church Committee Meeting'
  | 'Special Church Events';

export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export type MembershipStatus = 'active' | 'inactive' | 'suspended';

export type AttendanceMethod =
  | 'QR Scan'
  | 'Manual Member Search'
  | 'Walk-in Registration'
  | 'Visitor Registration';

export type VisitorType = 'first_timer' | 'returning_visitor' | 'walk_in';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  membership_number: string;
  full_name: string;
  telephone: string;
  email?: string | null;
  photo_url?: string | null;
  registration_date: string;
  membership_status: MembershipStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface QrCredential {
  id: string;
  member_id: string;
  credential_hash: string;
  status: 'active' | 'revoked';
  issued_at: string;
  revoked_at?: string | null;
}

export interface AttendanceSession {
  id: string;
  session_name: string;
  activity_type: ActivityType;
  meeting_date: string;
  start_time: string;
  end_time?: string | null;
  status: SessionStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile | null;
}

export interface Visitor {
  id: string;
  full_name: string;
  telephone?: string | null;
  email?: string | null;
  session_id: string;
  visitor_type: VisitorType;
  arrival_timestamp: string;
  status: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  member_id?: string | null;
  visitor_id?: string | null;
  attendance_method: AttendanceMethod;
  arrival_timestamp: string;
  recorded_by?: string | null;
  notes?: string | null;
  created_at: string;
  member?: Member | null;
  visitor?: Visitor | null;
  recorder?: Profile | null;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile | null;
}

export interface OfflineQueueItem {
  id: string;
  session_id: string;
  member_id?: string;
  visitor_id?: string;
  attendance_method: AttendanceMethod;
  arrival_timestamp: string;
  created_at: string;
  retry_count: number;
  sync_error?: string;
}
