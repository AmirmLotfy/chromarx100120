import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserPreferences } from './authService';

export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const prefsRef = doc(db, 'preferences', userId);
  const prefsSnap = await getDoc(prefsRef);
  
  if (!prefsSnap.exists()) {
    const defaultPrefs: UserPreferences = {
      theme: 'system',
      notifications: true,
      summarizationEnabled: true,
      language: 'en',
    };
    await setDoc(prefsRef, defaultPrefs);
    return defaultPrefs;
  }
  
  return prefsSnap.data() as UserPreferences;
};

export const updateUserPreferences = async (
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<void> => {
  const prefsRef = doc(db, 'preferences', userId);
  await setDoc(prefsRef, preferences, { merge: true });
};

export const subscribeToPreferences = (
  userId: string, 
  callback: (prefs: UserPreferences) => void
) => {
  const prefsRef = doc(db, 'preferences', userId);
  return onSnapshot(prefsRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as UserPreferences);
    }
  });
};