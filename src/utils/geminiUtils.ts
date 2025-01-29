import { auth } from '@/lib/firebase';

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.getIdToken();
}

async function callGeminiFunction(prompt: string, type: 'summarize' | 'categorize'): Promise<string> {
  try {
    const idToken = await getIdToken();
    const response = await fetch('https://us-central1-chromarx-215c8.cloudfunctions.net/getGeminiResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ prompt, type }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error calling Gemini function:', error);
    throw error;
  }
}

export async function summarizeContent(text: string): Promise<string> {
  try {
    return await callGeminiFunction(text, 'summarize');
  } catch (error) {
    console.error('Error summarizing content:', error);
    return 'Failed to generate summary';
  }
}

export async function suggestBookmarkCategory(title: string, url: string): Promise<string> {
  try {
    const prompt = `Title: ${title}\nURL: ${url}`;
    return await callGeminiFunction(prompt, 'categorize');
  } catch (error) {
    console.error('Error suggesting category:', error);
    return 'Uncategorized';
  }
}