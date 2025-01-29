import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AIGeneratedData {
  summary?: string;
  category?: string;
  suggestions?: string[];
  timestamp: number;
}

export async function summarizeContent(text: string, apiKey: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Summarize this content concisely in 2-3 sentences:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function suggestBookmarkCategory(
  title: string, 
  url: string, 
  apiKey: string
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Suggest a single category for this bookmark based on its title and URL. 
    Respond with just the category name, no explanation.
    Title: ${title}
    URL: ${url}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw new Error('Failed to suggest category');
  }
}

export async function storeAIGeneratedData(
  userId: string,
  itemId: string,
  data: AIGeneratedData
) {
  try {
    const docRef = doc(db, 'aiData', `${userId}_${itemId}`);
    await setDoc(docRef, {
      ...data,
      userId,
      itemId,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error storing AI data:', error);
    throw new Error('Failed to store AI data');
  }
}

export async function getAIGeneratedData(
  userId: string,
  itemId: string
): Promise<AIGeneratedData | null> {
  try {
    const docRef = doc(db, 'aiData', `${userId}_${itemId}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AIGeneratedData;
    }
    return null;
  } catch (error) {
    console.error('Error retrieving AI data:', error);
    throw new Error('Failed to retrieve AI data');
  }
}