import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TermsHistory {
  userId: string;
  url: string;
  title: string;
  timestamp: Timestamp;
  summary?: string;
}

export const addToHistory = async (
  userId: string,
  url: string,
  title: string,
  summary?: string
): Promise<void> => {
  const historyRef = collection(db, 'history');
  await addDoc(historyRef, {
    userId,
    url,
    title,
    timestamp: Timestamp.now(),
    summary
  });
};

export const getUserHistory = async (userId: string): Promise<TermsHistory[]> => {
  const historyRef = collection(db, 'history');
  const q = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as TermsHistory);
};

export const subscribeToHistory = (
  userId: string,
  callback: (history: TermsHistory[]) => void
) => {
  const historyRef = collection(db, 'history');
  const q = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const history = querySnapshot.docs.map(doc => doc.data() as TermsHistory);
    callback(history);
  });
};