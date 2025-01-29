import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function suggestBookmarkCategory(title: string, url: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this bookmark and suggest a single category that best describes it.
    Title: ${title}
    URL: ${url}
    
    Respond with just the category name, choosing from these options:
    - Development
    - Design
    - Business
    - Education
    - Entertainment
    - News
    - Technology
    - Personal
    - Other`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim();
    
    return category;
  } catch (error) {
    console.error('Error suggesting category:', error);
    return 'Other';
  }
}