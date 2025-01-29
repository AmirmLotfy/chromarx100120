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

export const storePayPalCredentials = async () => {
  try {
    await setDoc(doc(db, 'secrets', 'paypal'), {
      clientId: 'YOUR_PAYPAL_CLIENT_ID',
      secretKey: 'YOUR_PAYPAL_SECRET_KEY',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error storing PayPal credentials:', error);
    return false;
  }
};

export const getPayPalClientId = async () => {
  try {
    const docRef = doc(db, 'secrets', 'paypal');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().clientId;
    }
    return null;
  } catch (error) {
    console.error('Error getting PayPal client ID:', error);
    return null;
  }
};