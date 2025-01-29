import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const storeGeminiApiKey = async (userId: string, apiKey: string) => {
  try {
    await setDoc(doc(db, 'secrets', userId), {
      geminiApiKey: apiKey,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
};

export const getGeminiApiKey = async (userId: string) => {
  try {
    const docRef = doc(db, 'secrets', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().geminiApiKey;
    }
    return null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
};