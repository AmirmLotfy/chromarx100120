import { GoogleGenerativeAI } from "@google/generative-ai";

interface TaskSuggestion {
  suggestedPriority: "low" | "medium" | "high";
  suggestedCategory: string;
}

export async function getTaskSuggestions(title: string, description: string): Promise<TaskSuggestion> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Analyze this task and suggest a priority level (low, medium, or high) and a category. Only respond with JSON in this format: {"suggestedPriority": "low|medium|high", "suggestedCategory": "category"}

Task Title: ${title}
Task Description: ${description}

Consider:
- Urgency words like "urgent", "asap", "immediately" suggest high priority
- Words like "when possible", "eventually" suggest low priority
- The category should be a single word that best describes the task domain (e.g., "Development", "Design", "Marketing")`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestion = JSON.parse(response.text()) as TaskSuggestion;
    
    // Validate the response
    if (!["low", "medium", "high"].includes(suggestion.suggestedPriority)) {
      throw new Error("Invalid priority suggestion");
    }
    
    return suggestion;
  } catch (error) {
    console.error('Error getting task suggestions:', error);
    return {
      suggestedPriority: "medium",
      suggestedCategory: "General"
    };
  }
}