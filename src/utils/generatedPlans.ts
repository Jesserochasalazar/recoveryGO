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
import type { Routine, RoutineInput } from './userRotuines';

const COLLECTION = 'generatedPlans';

export type GeneratedPlan = Routine;
export type GeneratedPlanInput = RoutineInput;

export async function createGeneratedPlan(user: User, data: GeneratedPlanInput): Promise<string> {
  const db = getFirestore();
  const col = collection(db, COLLECTION);
  const ref = await addDoc(col, {
    ownerUid: user.uid,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGeneratedPlan(planId: string, patch: Partial<GeneratedPlanInput>): Promise<void> {
  const db = getFirestore();
  const ref = doc(db, COLLECTION, planId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function getGeneratedPlan(planId: string): Promise<GeneratedPlan | null> {
  const db = getFirestore();
  const ref = doc(db, COLLECTION, planId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as GeneratedPlan;
}

export async function listUserGeneratedPlans(ownerUid: string): Promise<GeneratedPlan[]> {
  const db = getFirestore();
  const col = collection(db, COLLECTION);
  const q = query(col, where('ownerUid', '==', ownerUid));
  const res = await getDocs(q);
  return res.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as GeneratedPlan[];
}

