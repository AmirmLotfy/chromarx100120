import { ChromeBookmark } from "@/types/bookmark";

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

export const summarizeBookmark = async (content: string): Promise<string> => {
  try {
    if (!chrome?.aiOriginTrial?.languageModel) {
      throw new Error('Chrome AI API not available');
    }

    const model = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: "You are a helpful AI assistant that provides concise summaries of bookmarks. Keep responses brief and informative.",
      temperature: 0.5
    });

    const prompt = `Please provide a brief summary of this bookmark:\n${content}`;
    const response = await model.prompt(prompt);
    return response;
  } catch (error) {
    console.error('Error summarizing bookmark:', error);
    return "Unable to generate summary at this time.";
  }
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    if (!chrome?.aiOriginTrial?.languageModel) {
      throw new Error('Chrome AI API not available');
    }

    const model = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: "You are a helpful AI assistant that suggests categories for bookmarks. Respond with just the category name.",
      temperature: 0.3
    });

    const prompt = `Suggest a single category for this bookmark:\nTitle: ${title}\nURL: ${url}\nRespond with just the category name.`;
    const response = await model.prompt(prompt);
    return response.trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    return "Uncategorized";
  }
};