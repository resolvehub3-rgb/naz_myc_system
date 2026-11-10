import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Member,
  AttendanceSession,
  AttendanceRecord,
  Visitor,
  AuditLog,
  AttendanceMethod,
  VisitorType,
  ActivityType,
} from '../types/database';
import {
  formatMembershipNumber,
  generateQrPayload,
  validateAttendanceAttempt,
} from '../lib/attendanceLogic';
import {
  enqueueOfflineAttendance,
  getOfflineQueue,
  subscribeOfflineQueue,
  cacheOfflineLookupData,
  syncOfflineQueue,
} from '../lib/offlineQueue';
import { useAuth } from './AuthContext';

interface ChurchContextType {
  members: Member[];
  sessions: AttendanceSession[];
  activeSession: AttendanceSession | null;
  attendanceRecords: AttendanceRecord[];
  visitors: Visitor[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  isOnline: boolean;
  offlineQueueCount: number;
  setActiveSession: (session: AttendanceSession | null) => void;
  refreshMembers: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  refreshVisitors: () => Promise<void>;
  refreshAuditLogs: () => Promise<void>;
  registerMember: (data: {
    full_name: string;
    telephone: string;
    email?: string;
    photo_url?: string;
    notes?: string;
  }) => Promise<{ success: boolean; member?: Member; error?: string }>;
  updateMember: (
    id: string,
    updates: Partial<Member>
  ) => Promise<{ success: boolean; error?: string }>;
  createSession: (data: {
    session_name: string;
    activity_type: ActivityType;
    meeting_date: string;
    start_time: string;
    end_time?: string;
  }) => Promise<{ success: boolean; session?: AttendanceSession; error?: string }>;
  updateSessionStatus: (
    sessionId: string,
    status: AttendanceSession['status']
  ) => Promise<{ success: boolean; error?: string }>;
  recordAttendance: (params: {
    sessionId: string;
    memberId?: string;
    visitorId?: string;
    method: AttendanceMethod;
    notes?: string;
  }) => Promise<{
    success: boolean;
    alreadyRecorded?: boolean;
    recordedAt?: string;
    error?: string;
    record?: AttendanceRecord;
    isOffline?: boolean;
  }>;
  registerVisitor: (data: {
    full_name: string;
    telephone?: string;
    email?: string;
    session_id: string;
    visitor_type: VisitorType;
  }) => Promise<{ success: boolean; visitor?: Visitor; error?: string }>;
  syncPendingRecords: () => Promise<void>;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isConfigured } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSessionState] = useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Network online/offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue().catch(console.error);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeQueue = subscribeOfflineQueue((queue) => {
      setOfflineQueueCount(queue.length);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeQueue();
    };
  }, []);

  const setActiveSession = (session: AttendanceSession | null) => {
    setActiveSessionState(session);
    if (session && typeof window !== 'undefined') {
      localStorage.setItem('mcg_active_session_id', session.id);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('mcg_active_session_id');
    }
  };

  // Fetch Members from Supabase
  const refreshMembers = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const memList = (data || []) as Member[];
      setMembers(memList);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [isConfigured]);

  // Fetch Sessions from Supabase
  const refreshSessions = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, creator:profiles(*)')
        .order('meeting_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      const sessionList = (data || []) as AttendanceSession[];
      setSessions(sessionList);

      // Restore active session if previously set or if one is marked 'active'
      const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('mcg_active_session_id') : null;
      if (savedActiveId) {
        const found = sessionList.find((s) => s.id === savedActiveId && s.status === 'active');
        if (found) {
          setActiveSessionState(found);
        } else {
          const firstActive = sessionList.find((s) => s.status === 'active');
          setActiveSessionState(firstActive || null);
        }
      } else {
        const firstActive = sessionList.find((s) => s.status === 'active');
        if (firstActive) setActiveSessionState(firstActive);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [isConfigured]);

  // Fetch Attendance Records from Supabase
  const refreshAttendance = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*, member:members(*), visitor:visitors(*), recorder:profiles(*)')
        .order('arrival_timestamp', { ascending: false })
        .limit(200);

      if (error) throw error;
      setAttendanceRecords((data || []) as AttendanceRecord[]);
    } catch (err) {
      console.error('Failed to load attendance records:', err);
    }
  }, [isConfigured]);

  // Fetch Visitors
  const refreshVisitors = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('arrival_timestamp', { ascending: false });

      if (error) throw error;
      setVisitors((data || []) as Visitor[]);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    }
  }, [isConfigured]);

  // Fetch Audit Logs
  const refreshAuditLogs = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, actor:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs((data || []) as AuditLog[]);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, [isConfigured]);

  // Initial load
  useEffect(() => {
    if (!isConfigured) {
      if (typeof window !== 'undefined') {
        try {
          const localMembers = localStorage.getItem('mcg_local_members');
          const localSessions = localStorage.getItem('mcg_local_sessions');
          const localRecords = localStorage.getItem('mcg_local_records');
          const localVisitors = localStorage.getItem('mcg_local_visitors');

          if (localMembers) {
            setMembers(JSON.parse(localMembers));
          }
          if (localSessions) {
            const parsed = JSON.parse(localSessions) as AttendanceSession[];
            setSessions(parsed);
            const active = parsed.find((s) => s.status === 'active');
            if (active) setActiveSessionState(active);
          } else {
            // Default initial session for Sunday Service if none exists
            const initialSession: AttendanceSession = {
              id: 'sess_initial_1',
              session_name: 'Sunday Youth Divine Service',
              activity_type: 'Sunday Service',
              meeting_date: new Date().toISOString().split('T')[0],
              start_time: '09:00',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setSessions([initialSession]);
            setActiveSessionState(initialSession);
            localStorage.setItem('mcg_local_sessions', JSON.stringify([initialSession]));
          }

          if (localRecords) setAttendanceRecords(JSON.parse(localRecords));
          if (localVisitors) setVisitors(JSON.parse(localVisitors));
        } catch (e) {
          console.warn('Error reading local church storage', e);
        }
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([
      refreshMembers(),
      refreshSessions(),
      refreshAttendance(),
      refreshVisitors(),
      refreshAuditLogs(),
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [isConfigured, refreshMembers, refreshSessions, refreshAttendance, refreshVisitors, refreshAuditLogs]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    if (!isConfigured) return;
    const supabase = getSupabase();

    const channel = supabase
      .channel('mcg_church_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        () => {
          refreshAttendance();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_sessions' },
        () => {
          refreshSessions();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        () => {
          refreshMembers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitors' },
        () => {
          refreshVisitors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConfigured, refreshAttendance, refreshSessions, refreshMembers, refreshVisitors]);

  // Register New Member
  const registerMember = async (data: {
    full_name: string;
    telephone: string;
    email?: string;
    photo_url?: string;
    notes?: string;
  }): Promise<{ success: boolean; member?: Member; error?: string }> => {
    const cleanPhone = data.telephone.trim();

    if (!isConfigured) {
      const existingPhone = members.find((m) => m.telephone === cleanPhone);
      if (existingPhone) {
        return {
          success: false,
          error: `A member with telephone number "${cleanPhone}" already exists (${existingPhone.full_name} - ${existingPhone.membership_number}).`,
        };
      }
      const nextNum = members.length + 1;
      const membershipNumber = formatMembershipNumber(nextNum);
      const newMember: Member = {
        id: 'mem_' + Date.now(),
        membership_number: membershipNumber,
        full_name: data.full_name.trim(),
        telephone: cleanPhone,
        email: data.email?.trim() || null,
        photo_url: data.photo_url || null,
        notes: data.notes?.trim() || null,
        membership_status: 'active',
        registration_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newMember, ...members];
      setMembers(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mcg_local_members', JSON.stringify(updated));
      }
      return { success: true, member: newMember };
    }

    try {
      const supabase = getSupabase();

      // Check for duplicate telephone
      const cleanPhone = data.telephone.trim();
      const { data: existingPhone, error: phoneErr } = await supabase
        .from('members')
        .select('id, full_name, membership_number')
        .eq('telephone', cleanPhone)
        .maybeSingle();

      if (phoneErr && phoneErr.code !== 'PGRST116') {
        console.warn('Phone check error:', phoneErr);
      }

      if (existingPhone) {
        return {
          success: false,
          error: `A member with telephone number "${cleanPhone}" already exists (${existingPhone.full_name} - ${existingPhone.membership_number}).`,
        };
      }

      // Generate sequence number securely
      const { data: allMembers } = await supabase
        .from('members')
        .select('membership_number');

      let nextNum = 1;
      if (allMembers && allMembers.length > 0) {
        const numbers = allMembers
          .map((m) => {
            const match = m.membership_number?.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          })
          .filter((n) => !isNaN(n));
        if (numbers.length > 0) {
          nextNum = Math.max(...numbers) + 1;
        }
      }

      const membershipNumber = formatMembershipNumber(nextNum);

      // Insert Member
      const { data: newMember, error: insertErr } = await supabase
        .from('members')
        .insert({
          membership_number: membershipNumber,
          full_name: data.full_name.trim(),
          telephone: cleanPhone,
          email: data.email?.trim() || null,
          photo_url: data.photo_url || null,
          notes: data.notes?.trim() || null,
          membership_status: 'active',
          registration_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertErr || !newMember) {
        throw new Error(insertErr?.message || 'Failed to insert member');
      }

      const memberObj = newMember as Member;

      // Generate and store QR Credential
      const qrPayload = generateQrPayload(memberObj.id, memberObj.membership_number);
      await supabase.from('qr_credentials').insert({
        member_id: memberObj.id,
        credential_hash: qrPayload,
        status: 'active',
      });

      // Audit log
      if (profile) {
        await supabase.from('audit_logs').insert({
          actor_id: profile.id,
          action: 'REGISTER_MEMBER',
          entity_type: 'member',
          entity_id: memberObj.id,
          new_values: {
            membership_number: memberObj.membership_number,
            full_name: memberObj.full_name,
            telephone: memberObj.telephone,
          },
        });
      }

      await refreshMembers();
      return { success: true, member: memberObj };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  // Update Member Details
  const updateMember = async (
    id: string,
    updates: Partial<Member>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      const updated = members.map((m) => (m.id === id ? { ...m, ...updates } : m));
      setMembers(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mcg_local_members', JSON.stringify(updated));
      }
      return { success: true };
    }
    try {
      const supabase = getSupabase();
      const prevMember = members.find((m) => m.id === id);

      const { error } = await supabase
        .from('members')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (profile && prevMember) {
        await supabase.from('audit_logs').insert({
          actor_id: profile.id,
          action: 'UPDATE_MEMBER',
          entity_type: 'member',
          entity_id: id,
          previous_values: {
            status: prevMember.membership_status,
            full_name: prevMember.full_name,
          },
          new_values: updates,
        });
      }

      await refreshMembers();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  // Create Attendance Session
  const createSession = async (data: {
    session_name: string;
    activity_type: ActivityType;
    meeting_date: string;
    start_time: string;
    end_time?: string;
  }): Promise<{ success: boolean; session?: AttendanceSession; error?: string }> => {
    if (!isConfigured) {
      const newSession: AttendanceSession = {
        id: 'sess_' + Date.now(),
        session_name: data.session_name.trim(),
        activity_type: data.activity_type,
        meeting_date: data.meeting_date,
        start_time: data.start_time,
        end_time: data.end_time || null,
        status: 'active',
        created_by: profile?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newSession, ...sessions];
      setSessions(updated);
      setActiveSession(newSession);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mcg_local_sessions', JSON.stringify(updated));
      }
      return { success: true, session: newSession };
    }

    try {
      const supabase = getSupabase();
      const { data: newSession, error } = await supabase
        .from('attendance_sessions')
        .insert({
          session_name: data.session_name.trim(),
          activity_type: data.activity_type,
          meeting_date: data.meeting_date,
          start_time: data.start_time,
          end_time: data.end_time || null,
          status: 'active', // Set active right away for immediate scanning
          created_by: profile?.id || null,
        })
        .select()
        .single();

      if (error || !newSession) throw new Error(error?.message || 'Failed to create session');

      const created = newSession as AttendanceSession;
      setActiveSession(created);
      await refreshSessions();
      return { success: true, session: created };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  // Update Session Status
  const updateSessionStatus = async (
    sessionId: string,
    status: AttendanceSession['status']
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      const updated = sessions.map((s) => (s.id === sessionId ? { ...s, status } : s));
      setSessions(updated);
      if (status === 'completed' && activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mcg_local_sessions', JSON.stringify(updated));
      }
      return { success: true };
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;

      if (status === 'completed' && activeSession?.id === sessionId) {
        setActiveSession(null);
      }

      await refreshSessions();
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  // Record Attendance (Scan or Manual)
  const recordAttendance = async (params: {
    sessionId: string;
    memberId?: string;
    visitorId?: string;
    method: AttendanceMethod;
    notes?: string;
  }): Promise<{
    success: boolean;
    alreadyRecorded?: boolean;
    recordedAt?: string;
    error?: string;
    record?: AttendanceRecord;
    isOffline?: boolean;
  }> => {
    const { sessionId, memberId, visitorId, method, notes } = params;

    // 1. Check active session
    const targetSession = sessions.find((s) => s.id === sessionId) || activeSession;
    if (!targetSession || targetSession.status !== 'active') {
      return {
        success: false,
        error: `Meeting session is ${targetSession ? targetSession.status : 'inactive'}. Only active sessions can record attendance.`,
      };
    }

    // 2. Check for duplicate scan in the same session
    if (memberId) {
      const existing = attendanceRecords.find(
        (r) => r.session_id === sessionId && r.member_id === memberId
      );
      if (existing) {
        return {
          success: false,
          alreadyRecorded: true,
          recordedAt: existing.arrival_timestamp,
          record: existing,
          error: `Attendance already recorded for this member at ${new Date(
            existing.arrival_timestamp
          ).toLocaleTimeString('en-GB')}.`,
        };
      }
    }

    const arrivalTimestamp = new Date().toISOString();

    // 3. Offline Mode check
    if (!isOnline || !isConfigured) {
      enqueueOfflineAttendance({
        session_id: sessionId,
        member_id: memberId,
        visitor_id: visitorId,
        attendance_method: method,
        arrival_timestamp: arrivalTimestamp,
      });

      const memberObj = memberId ? members.find((m) => m.id === memberId) : null;
      const visitorObj = visitorId ? visitors.find((v) => v.id === visitorId) : null;
      const newRec: AttendanceRecord = {
        id: 'rec_offline_' + Date.now(),
        session_id: sessionId,
        member_id: memberId || null,
        visitor_id: visitorId || null,
        attendance_method: method,
        arrival_timestamp: arrivalTimestamp,
        created_at: arrivalTimestamp,
        member: memberObj || null,
        visitor: visitorObj || null,
      };

      const updated = [newRec, ...attendanceRecords];
      setAttendanceRecords(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mcg_local_records', JSON.stringify(updated));
      }

      return {
        success: true,
        isOffline: true,
        recordedAt: arrivalTimestamp,
        record: newRec,
      };
    }

    // 4. Online Supabase Insert
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          member_id: memberId || null,
          visitor_id: visitorId || null,
          attendance_method: method,
          arrival_timestamp: arrivalTimestamp,
          recorded_by: profile?.id || null,
          notes: notes?.trim() || null,
        })
        .select('*, member:members(*), visitor:visitors(*)')
        .single();

      if (error) {
        // Unique violation check (already recorded concurrently)
        if (error.code === '23505') {
          return {
            success: false,
            alreadyRecorded: true,
            error: 'Attendance already recorded for this member in this session.',
          };
        }
        throw error;
      }

      await refreshAttendance();
      return {
        success: true,
        record: data as AttendanceRecord,
        recordedAt: arrivalTimestamp,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Fallback: enqueue locally so scan is never lost!
      enqueueOfflineAttendance({
        session_id: sessionId,
        member_id: memberId,
        visitor_id: visitorId,
        attendance_method: method,
        arrival_timestamp: arrivalTimestamp,
      });

      return {
        success: true,
        isOffline: true,
        recordedAt: arrivalTimestamp,
        error: `Saved to offline queue due to network error: ${msg}`,
      };
    }
  };

  // Register Visitor
  const registerVisitor = async (data: {
    full_name: string;
    telephone?: string;
    email?: string;
    session_id: string;
    visitor_type: VisitorType;
  }): Promise<{ success: boolean; visitor?: Visitor; error?: string }> => {
    if (!isConfigured) return { success: false, error: 'Database not connected' };
    try {
      const supabase = getSupabase();
      const arrival = new Date().toISOString();

      const { data: newVis, error } = await supabase
        .from('visitors')
        .insert({
          full_name: data.full_name.trim(),
          telephone: data.telephone?.trim() || null,
          email: data.email?.trim() || null,
          session_id: data.session_id,
          visitor_type: data.visitor_type,
          arrival_timestamp: arrival,
          status: 'attended',
        })
        .select()
        .single();

      if (error || !newVis) throw new Error(error?.message || 'Failed to register visitor');

      // Also record attendance record for visitor
      await supabase.from('attendance_records').insert({
        session_id: data.session_id,
        visitor_id: newVis.id,
        attendance_method: 'Visitor Registration',
        arrival_timestamp: arrival,
        recorded_by: profile?.id || null,
      });

      await Promise.all([refreshVisitors(), refreshAttendance()]);
      return { success: true, visitor: newVis as Visitor };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  const syncPendingRecords = async () => {
    await syncOfflineQueue();
    await refreshAttendance();
  };

  return (
    <ChurchContext.Provider
      value={{
        members,
        sessions,
        activeSession,
        attendanceRecords,
        visitors,
        auditLogs,
        isLoading,
        isOnline,
        offlineQueueCount,
        setActiveSession,
        refreshMembers,
        refreshSessions,
        refreshAttendance,
        refreshVisitors,
        refreshAuditLogs,
        registerMember,
        updateMember,
        createSession,
        updateSessionStatus,
        recordAttendance,
        registerVisitor,
        syncPendingRecords,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (!context) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
};
