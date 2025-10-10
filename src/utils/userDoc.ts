import type { User } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Profile } from '../types';

type Extras = Partial<Pick<Profile, 'firstName' | 'lastName' | 'gender' | 'age' | 'userType' | 'onboarded'>>;


export async function upsertUser(user: User, extras?: Extras) {
  const db = getFirestore();
  const ref = doc(db, 'users', user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? null,
      updatedAt: serverTimestamp(),
      ...(extras ?? {}),
    },
    { merge: true }
  );
}
