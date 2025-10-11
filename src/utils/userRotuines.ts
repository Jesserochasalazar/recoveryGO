import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Exercise } from '../exercise';

export type RoutineVisibility = 'Private' | 'Public';

export type Routine = {
  id: string;
  ownerUid: string;
  name: string;
  description?: string;
  duration?: string; // e.g., '4 weeks'
  visibility: RoutineVisibility;
  exercises: Exercise[];
  summary?: { totalExercises: number; totalVolume?: number };
  createdAt: any;
  updatedAt: any;
};

export type RoutineInput = Omit<Routine, 'id' | 'ownerUid' | 'createdAt' | 'updatedAt'>;

// Create a new routine for a user
export async function createRoutine(user: User, data: RoutineInput): Promise<string> {
  const db = getFirestore();
  const col = collection(db, 'routines');
  const docRef = await addDoc(col, {
    ownerUid: user.uid,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Update an existing routine by id
export async function updateRoutine(routineId: string, patch: Partial<RoutineInput>): Promise<void> {
  const db = getFirestore();
  const ref = doc(db, 'routines', routineId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

// Upsert helper (create if no id, else update)
export async function upsertRoutine(user: User, routineId: string | null, data: RoutineInput): Promise<string> {
  if (routineId) {
    await updateRoutine(routineId, data);
    return routineId;
  }
  return createRoutine(user, data);
}

// Get routine by id
export async function getRoutine(routineId: string): Promise<Routine | null> {
  const db = getFirestore();
  const ref = doc(db, 'routines', routineId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data() as any;
  return { id: snap.id, ...d } as Routine;
}

// List routines for a given owner
export async function listUserRoutines(ownerUid: string): Promise<Routine[]> {
  const db = getFirestore();
  const col = collection(db, 'routines');
  const q = query(col, where('ownerUid', '==', ownerUid));
  const res = await getDocs(q);
  return res.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })) as Routine[];
}
