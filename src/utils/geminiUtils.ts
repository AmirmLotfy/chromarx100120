import { getAuth } from "firebase/auth";

export const summarizeContent = async (prompt: string): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const idToken = await user.getIdToken();
    
    const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/getGeminiResponse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        prompt,
        type: 'summarize',
        language: 'en',
        contentType: 'bookmark'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get summary');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

export const summarizeBookmark = async (content: string): Promise<string> => {
  return summarizeContent(content);
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const idToken = await user.getIdToken();
    
    const response = await fetch(`${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/getGeminiResponse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        prompt: `${title}\n${url}`,
        type: 'categorize',
        language: 'en'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get category suggestion');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw error;
  }
};