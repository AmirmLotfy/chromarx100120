import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PrivacySettings {
  dataCollection: boolean;
  notifications: {
    bookmarks: boolean;
    updates: boolean;
    reminders: boolean;
  }
}

export const savePrivacySettings = async (userId: string, settings: PrivacySettings) => {
  try {
    console.log('Saving privacy settings:', settings);
    const docRef = doc(db, 'preferences', userId);
    await setDoc(docRef, { privacy: settings }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving privacy settings:', error);
    return false;
  }
};

export const getPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => {
  try {
    const docRef = doc(db, 'preferences', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.privacy as PrivacySettings;
    }
    return null;
  } catch (error) {
    console.error('Error getting privacy settings:', error);
    return null;
  }
};