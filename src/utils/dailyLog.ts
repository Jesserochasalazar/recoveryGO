import type { User } from 'firebase/auth';
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export type ExerciseSummary = {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
};

export type DailyEntry = {
  ownerUid: string;
  dateKey: string; // YYYY-MM-DD (local)
  planType: 'routine' | 'generated';
  planId: string;
  planName?: string;
  exercises: ExerciseSummary[]; // snapshot for the day
  statuses: Record<string, 'pending' | 'in_progress' | 'completed'>;
  completedCount: number;
  totalExercises: number;
  createdAt: any;
  updatedAt: any;
};

export type PlanSession = {
  ownerUid: string;
  planType: 'routine' | 'generated';
  planId: string;
  planName?: string;
  durationDays: number;
  startDate: any; // Timestamp
  endDate: any; // Timestamp
  exercises: ExerciseSummary[]; // snapshot of plan at start/replace time
  createdAt: any;
  updatedAt: any;
};

export function getDateKey(d = new Date()): string {
  const year = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${m}-${day}`;
}

export function parseDurationToDays(duration?: string | null, fallbackDays = 28): number {
  if (!duration) return fallbackDays;
  const match = String(duration).trim().match(/(\d+)\s*(week|weeks|day|days)/i);
  if (!match) return fallbackDays;
  const n = parseInt(match[1], 10) || 0;
  const unit = match[2].toLowerCase();
  if (unit.startsWith('week')) return Math.max(1, n) * 7;
  if (unit.startsWith('day')) return Math.max(1, n);
  return fallbackDays;
}

const sessionDocId = (uid: string) => `session_${uid}`;
const entryDocId = (uid: string, dateKey: string) => `entry_${uid}_${dateKey}`;

export async function getActiveSession(user: User): Promise<PlanSession | null> {
  const db = getFirestore();
  const ref = doc(db, 'dailyLog', sessionDocId(user.uid));
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as PlanSession) : null;
}

export async function startOrReplacePlanSession(user: User, opts: {
  planType: 'routine' | 'generated';
  planId: string;
  planName?: string;
  durationString?: string | null;
  exercises: ExerciseSummary[];
  keepRemaining?: boolean; // when true, keep remaining window if an active session exists
}): Promise<PlanSession> {
  const db = getFirestore();
  const ref = doc(db, 'dailyLog', sessionDocId(user.uid));
  const existingSnap = await getDoc(ref);
  const now = Date.now();

  const keepRemaining = opts.keepRemaining !== false; // default true
  let endMillis: number | null = null;
  if (keepRemaining && existingSnap.exists()) {
    const ex: any = existingSnap.data();
    const exEnd = ex?.endDate?.toMillis ? ex.endDate.toMillis() : null;
    if (exEnd && exEnd > now) {
      endMillis = exEnd; // keep remaining duration window
    }
  }

  const durationDays = parseDurationToDays(opts.durationString, 28);
  const startMillis = new Date().setHours(0, 0, 0, 0);
  if (!endMillis) {
    // New session window based on duration
    endMillis = startMillis + durationDays * 24 * 60 * 60 * 1000 - 1;
  }

  // Build payload without any undefined values (Firestore rejects undefined)
  const exercises = (opts.exercises || []).map((e) => {
    const o: any = { id: e.id, name: e.name };
    if (e.sets !== undefined) o.sets = e.sets;
    if (e.reps !== undefined) o.reps = e.reps;
    if (e.duration !== undefined) o.duration = e.duration;
    return o;
  });
  const payload: any = {
    ownerUid: user.uid,
    planType: opts.planType,
    planId: opts.planId,
    durationDays,
    startDate: new Date(startMillis) as any,
    endDate: new Date(endMillis) as any,
    exercises,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (opts.planName !== undefined) payload.planName = opts.planName;

  await setDoc(ref, payload);
  return payload as any;
}

export async function replaceTodayEntryWithPlan(user: User, plan: {
  planType: 'routine' | 'generated';
  planId: string;
  planName?: string;
  exercises: ExerciseSummary[];
}): Promise<DailyEntry> {
  const db = getFirestore();
  const dateKey = getDateKey();
  const ref = doc(db, 'dailyLog', entryDocId(user.uid, dateKey));

  const statuses: Record<string, 'pending' | 'in_progress' | 'completed'> = {};
  const exercises = (plan.exercises || []).map((e) => {
    const o: any = { id: e.id, name: e.name };
    if (e.sets !== undefined) o.sets = e.sets;
    if (e.reps !== undefined) o.reps = e.reps;
    if (e.duration !== undefined) o.duration = e.duration;
    statuses[o.id] = 'pending';
    return o;
  });

  const entry: any = {
    ownerUid: user.uid,
    dateKey,
    planType: plan.planType,
    planId: plan.planId,
    exercises,
    statuses,
    totalExercises: exercises.length,
    completedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (plan.planName !== undefined) entry.planName = plan.planName;

  await setDoc(ref, entry);
  return entry as DailyEntry;
}

export async function listEntriesForSession(user: User, session: PlanSession): Promise<DailyEntry[]> {
  const db = getFirestore();
  const col = collection(db, 'dailyLog');
  // Equality filters only to avoid composite index requirements
  const qy = query(
    col,
    where('ownerUid', '==', user.uid),
    where('planId', '==', session.planId),
    where('planType', '==', session.planType),
  );
  const res = await getDocs(qy);
  const entries: DailyEntry[] = [];
  res.forEach((snap) => {
    const d = snap.data() as any;
    // filter to only entry docs (have dateKey)
    if (d && typeof d.dateKey === 'string') {
      entries.push({ id: snap.id, ...d } as any);
    }
  });
  // sort by dateKey asc
  entries.sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));
  return entries;
}

export async function getDailyEntry(user: User, dateKey: string): Promise<DailyEntry | null> {
  const db = getFirestore();
  const ref = doc(db, 'dailyLog', entryDocId(user.uid, dateKey));
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as DailyEntry) : null;
}

export async function ensureTodayEntry(user: User, plan: {
  planType: 'routine' | 'generated';
  planId: string;
  planName?: string;
  exercises: ExerciseSummary[];
}): Promise<DailyEntry> {
  const db = getFirestore();
  const dateKey = getDateKey();
  const ref = doc(db, 'dailyLog', entryDocId(user.uid, dateKey));
  const existing = await getDoc(ref);
  if (existing.exists()) return ({ id: existing.id, ...(existing.data() as any) } as DailyEntry);

  const statuses: Record<string, 'pending' | 'in_progress' | 'completed'> = {};
  for (const e of plan.exercises) statuses[e.id] = 'pending';
  const exercises = (plan.exercises || []).map((e) => {
    const o: any = { id: e.id, name: e.name };
    if (e.sets !== undefined) o.sets = e.sets;
    if (e.reps !== undefined) o.reps = e.reps;
    if (e.duration !== undefined) o.duration = e.duration;
    return o;
  });
  const entry: any = {
    ownerUid: user.uid,
    dateKey,
    planType: plan.planType,
    planId: plan.planId,
    exercises,
    statuses,
    totalExercises: exercises.length,
    completedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (plan.planName !== undefined) entry.planName = plan.planName;
  await setDoc(ref, entry);
  return entry as DailyEntry;
}

export async function updateDailyEntryStatus(user: User, dateKey: string, exerciseId: string, status: 'pending' | 'in_progress' | 'completed') {
  const db = getFirestore();
  const ref = doc(db, 'dailyLog', entryDocId(user.uid, dateKey));
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as any;
  const statuses = { ...(data.statuses || {}) } as Record<string, 'pending' | 'in_progress' | 'completed'>;
  statuses[exerciseId] = status;
  const completedCount = Object.values(statuses).filter((s) => s === 'completed').length;
  await updateDoc(ref, { statuses, completedCount, updatedAt: serverTimestamp() });
}
