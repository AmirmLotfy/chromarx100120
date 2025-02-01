export const summarizeContent = async (prompt: string): Promise<string> => {
  try {
    if (!chrome?.aiOriginTrial?.languageModel) {
      throw new Error('Chrome AI API not available');
    }

    const model = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: "You are a helpful AI assistant that helps users find and understand their bookmarks. Always provide concise and relevant responses.",
      temperature: 0.7
    });

    const response = await model.prompt(prompt);
    return response;
  } catch (error) {
    console.error('Error using Chrome AI API:', error);
    return "I apologize, but I'm having trouble accessing the AI service at the moment. Please try again later.";
  }
};