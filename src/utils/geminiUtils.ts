import { auth } from "@/lib/chrome-utils";

interface GeminiRequest {
  prompt: string;
  type: 'summarize' | 'categorize';
  language: string;
  contentType?: string;
}

interface GeminiResponse {
  result: string;
}

export const getGeminiResponse = async (request: GeminiRequest): Promise<GeminiResponse> => {
  try {
    const user = await auth.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('YOUR_CLOUD_FUNCTION_URL/getGeminiResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await auth.getIdToken()}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to get Gemini response');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
};