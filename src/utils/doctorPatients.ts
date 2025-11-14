import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

export type DoctorPatientLink = {
  id: string;
  doctorUid: string;
  doctorName?: string;
  patientUid?: string;
  invitedEmail: string;
  patientName?: string;
  patientProfile?: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
  };
  status: 'invited' | 'pending' | 'active' | 'declined';
  progressPercent?: number;
  lastProgressAt?: any;
  createdAt: any;
  updatedAt: any;
};

const COLLECTION = 'patients';

export async function invitePatientByEmail(
  doctor: User,
  email: string,
  opts?: { doctorName?: string }
): Promise<string> {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) throw new Error('Email is required');

  const db = getFirestore();
  const col = collection(db, COLLECTION);
  const doctorName = (opts?.doctorName ?? doctor.displayName ?? '').trim();
  const docRef = await addDoc(col, {
    doctorUid: doctor.uid,
    invitedEmail: trimmedEmail,
    ...(doctorName ? { doctorName } : {}),
    status: 'invited',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listDoctorPatients(doctorUid: string): Promise<DoctorPatientLink[]> {
  if (!doctorUid) return [];
  const db = getFirestore();
  const col = collection(db, COLLECTION);
  const qy = query(col, where('doctorUid', '==', doctorUid));
  const snapshot = await getDocs(qy);
  const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })) as DoctorPatientLink[];

  const uids = Array.from(
    new Set(items.map((item) => item.patientUid).filter((uid): uid is string => typeof uid === 'string' && uid.length > 0))
  );
  if (uids.length) {
    const profileEntries = await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? ({ uid, ...(snap.data() as any) } as any) : null;
        } catch {
          return null;
        }
      })
    );
    const map = new Map<string, any>();
    profileEntries.forEach((entry) => {
      if (entry?.uid) map.set(entry.uid, entry);
    });
    items.forEach((item) => {
      if (!item.patientUid) return;
      const profile = map.get(item.patientUid);
      if (profile) {
        const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
        item.patientProfile = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        };
        if (!item.patientName && fullName) item.patientName = fullName;
      }
    });
  }

  items.sort((a, b) => {
    const aTs = (a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0);
    const bTs = (b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0);
    return bTs - aTs;
  });
  return items;
}

export async function listPendingInvitesForPatient(user: User): Promise<DoctorPatientLink[]> {
  const email = (user.email ?? '').trim().toLowerCase();
  if (!email && !user.uid) return [];

  const db = getFirestore();
  const col = collection(db, COLLECTION);
  const queries = [];
  if (email) {
    queries.push(getDocs(query(col, where('invitedEmail', '==', email))));
  }
  if (user.uid) {
    queries.push(getDocs(query(col, where('patientUid', '==', user.uid))));
  }
  const snapshots = await Promise.all(queries);
  const merged = new Map<string, DoctorPatientLink>();
  snapshots.forEach((snap) => {
    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...(docSnap.data() as any) } as DoctorPatientLink;
      merged.set(docSnap.id, data);
    });
  });
  return Array.from(merged.values()).filter((d) => d.status === 'invited' || d.status === 'pending');
}

async function requireInviteForUser(user: User, inviteId: string): Promise<{ ref: ReturnType<typeof doc>; data: DoctorPatientLink & Record<string, any>; email: string }> {
  const db = getFirestore();
  const ref = doc(db, COLLECTION, inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Invite not found');
  const data = { id: snap.id, ...(snap.data() as any) } as DoctorPatientLink & Record<string, any>;
  const email = (user.email ?? '').trim().toLowerCase();
  if (data.patientUid && data.patientUid !== user.uid) {
    throw new Error('Invite already linked to another patient.');
  }
  if (data.invitedEmail && email && data.invitedEmail !== email) {
    throw new Error('This invite is for a different email.');
  }
  if (data.status === 'declined') {
    throw new Error('Invite was declined.');
  }
  return { ref, data, email };
}

export async function acceptPatientInvite(user: User, inviteId: string, opts?: { patientName?: string }) {
  const { ref, data, email } = await requireInviteForUser(user, inviteId);
  const patientName =
    opts?.patientName?.trim() ||
    user.displayName ||
    `${(user as any)?.firstName ?? ''} ${(user as any)?.lastName ?? ''}`.trim() ||
    email ||
    'Patient';

  await updateDoc(ref, {
    patientUid: user.uid,
    patientName: patientName || data.patientName,
    invitedEmail: email || data.invitedEmail,
    status: 'active',
    updatedAt: serverTimestamp(),
  });
}

export async function declinePatientInvite(user: User, inviteId: string) {
  const { ref, data, email } = await requireInviteForUser(user, inviteId);
  if (data.status === 'active') {
    throw new Error('Invite already accepted.');
  }
  await updateDoc(ref, {
    patientUid: user.uid,
    invitedEmail: email || data.invitedEmail,
    status: 'declined',
    updatedAt: serverTimestamp(),
  });
}

export async function updatePatientProgress(user: User, percent: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const db = getFirestore();
  const col = collection(db, COLLECTION);
  const qy = query(col, where('patientUid', '==', user.uid), where('status', '==', 'active'));
  const snap = await getDocs(qy);
  if (snap.empty) return;
  await Promise.all(
    snap.docs.map((docSnap) =>
      updateDoc(doc(db, COLLECTION, docSnap.id), {
        progressPercent: clamped,
        lastProgressAt: serverTimestamp(),
      })
    )
  );
}
