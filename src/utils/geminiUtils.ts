export const summarizeContent = async (prompt: string): Promise<string> => {
  try {
    const capabilities = await chrome.aiOriginTrial.summarizer.capabilities();
    
    if (capabilities.available === 'no') {
      throw new Error("Chrome AI summarizer is not available");
    }

    const summarizer = await chrome.aiOriginTrial.summarizer.create({
      type: 'tl;dr',
      format: 'plain-text',
      length: 'medium'
    });

    await summarizer.ready;
    const summary = await summarizer.summarize(prompt);
    return summary;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
    
    if (capabilities.available === 'no') {
      throw new Error("Chrome AI language model is not available");
    }

    const model = await chrome.aiOriginTrial.languageModel.create({
      systemPrompt: "You are a helpful assistant that categorizes bookmarks. Respond with a single word category.",
      temperature: 0.2
    });

    const prompt = `Given this bookmark with title "${title}" and URL "${url}", suggest a single word category for it. Only respond with the category word, nothing else.`;
    const category = await model.prompt(prompt);
    return category.trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw error;
  }
};

export const summarizeBookmark = async (content: string): Promise<string> => {
  return summarizeContent(content);
};