import { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from './FirebaseContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface GeminiContextType {
  apiKey: string | null;
  setApiKey: (key: string) => Promise<void>;
  isLoading: boolean;
}

const GeminiContext = createContext<GeminiContextType>({
  apiKey: null,
  setApiKey: async () => {},
  isLoading: true,
});

export const GeminiProvider = ({ children }: { children: React.ReactNode }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useFirebase();

  useEffect(() => {
    const loadApiKey = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().geminiApiKey) {
          setApiKeyState(docSnap.data().geminiApiKey);
        }
      } catch (error) {
        console.error('Error loading Gemini API key:', error);
        toast.error('Failed to load API key');
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, [user]);

  const setApiKey = async (key: string) => {
    if (!user) {
      toast.error('Please sign in to save API key');
      return;
    }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        geminiApiKey: key,
      }, { merge: true });
      
      setApiKeyState(key);
      toast.success('API key saved successfully');
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    }
  };

  return (
    <GeminiContext.Provider value={{ apiKey, setApiKey, isLoading }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);