import { OfflineQueueItem, Member, AttendanceSession } from '../types/database';
import { getSupabase } from './supabase';

const QUEUE_STORAGE_KEY = 'mcg_offline_attendance_queue';
const CACHED_MEMBERS_KEY = 'mcg_cached_members_offline';
const CACHED_SESSIONS_KEY = 'mcg_cached_sessions_offline';

type SyncListener = (items: OfflineQueueItem[]) => void;
const listeners: Set<SyncListener> = new Set();

export function getOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse offline queue:', e);
    return [];
  }
}

function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (e) {
    console.error('Failed to save offline queue:', e);
  }
}

export function subscribeOfflineQueue(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(getOfflineQueue());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  const current = getOfflineQueue();
  listeners.forEach(fn => fn(current));
}

/**
 * Adds an attendance event to the offline queue
 */
export function enqueueOfflineAttendance(item: Omit<OfflineQueueItem, 'id' | 'created_at' | 'retry_count'>): OfflineQueueItem {
  const queue = getOfflineQueue();
  const id = 'offline_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

  const newItem: OfflineQueueItem = {
    ...item,
    id,
    created_at: new Date().toISOString(),
    retry_count: 0
  };

  // Check for duplicate in queue
  const isDuplicate = queue.some(
    q => q.session_id === newItem.session_id && q.member_id && q.member_id === newItem.member_id
  );

  if (!isDuplicate) {
    queue.push(newItem);
    saveOfflineQueue(queue);
  }

  return newItem;
}

/**
 * Cache members and active sessions in localStorage for offline scanning lookup
 */
export function cacheOfflineLookupData(members: Member[], sessions: AttendanceSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHED_MEMBERS_KEY, JSON.stringify(members));
    localStorage.setItem(CACHED_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Could not cache offline members:', e);
  }
}

export function getCachedMembers(): Member[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHED_MEMBERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCachedSessions(): AttendanceSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CACHED_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Synchronizes pending offline records to Supabase when online
 */
export async function syncOfflineQueue(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { synced: 0, failed: 0, remaining: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  const supabase = getSupabase();
  const remainingItems: OfflineQueueItem[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const { error } = await supabase.from('attendance_records').insert({
        session_id: item.session_id,
        member_id: item.member_id || null,
        visitor_id: item.visitor_id || null,
        attendance_method: item.attendance_method,
        arrival_timestamp: item.arrival_timestamp
      });

      if (error) {
        // If it's a unique constraint violation (code 23505), it was already recorded
        if (error.code === '23505') {
          // Already recorded in database, safely discard from offline queue
          syncedCount++;
        } else {
          failedCount++;
          remainingItems.push({
            ...item,
            retry_count: item.retry_count + 1,
            sync_error: error.message
          });
        }
      } else {
        syncedCount++;
      }
    } catch (err: unknown) {
      failedCount++;
      const msg = err instanceof Error ? err.message : String(err);
      remainingItems.push({
        ...item,
        retry_count: item.retry_count + 1,
        sync_error: msg
      });
    }
  }

  saveOfflineQueue(remainingItems);
  return {
    synced: syncedCount,
    failed: failedCount,
    remaining: remainingItems.length
  };
}

// Auto-sync when browser goes back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueue().catch(console.error);
  });
}
