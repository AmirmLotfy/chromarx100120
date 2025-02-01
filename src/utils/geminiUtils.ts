let aiSession: chrome.aiOriginTrial.AILanguageModelSession | null = null;
let aiSummarizer: chrome.aiOriginTrial.AISummarizer | null = null;

const initializeAISession = async () => {
  try {
    if (chrome?.aiOriginTrial?.languageModel) {
      const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
      
      if (capabilities.available !== 'no') {
        console.log('Using Chrome AI Language Model API');
        const session = await chrome.aiOriginTrial.languageModel.create({
          systemPrompt: "You are a helpful AI assistant for a Chrome extension that manages bookmarks.",
          temperature: 0.7,
          topK: 40,
        });
        return session;
      }
    }
    throw new Error('Chrome AI Language Model API not available');
  } catch (error) {
    console.error('Error initializing AI session:', error);
    throw error;
  }
};

const initializeSummarizer = async () => {
  try {
    if (chrome?.aiOriginTrial?.summarizer) {
      const capabilities = await chrome.aiOriginTrial.summarizer.capabilities();
      
      if (capabilities.available !== 'no') {
        console.log('Using Chrome AI Summarizer API');
        const summarizer = await chrome.aiOriginTrial.summarizer.create({
          type: 'key-points',
          format: 'markdown',
          length: 'medium',
        });
        await summarizer.ready;
        return summarizer;
      }
    }
    throw new Error('Chrome AI Summarizer API not available');
  } catch (error) {
    console.error('Error initializing summarizer:', error);
    throw error;
  }
};

export const summarizeContent = async (content: string): Promise<string> => {
  try {
    if (!aiSummarizer) {
      aiSummarizer = await initializeSummarizer();
    }

    console.log('Generating summary for content:', content);
    const summary = await aiSummarizer.summarize(content);
    console.log('Generated summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

export const summarizeBookmark = summarizeContent;

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    if (!aiSession) {
      aiSession = await initializeAISession();
    }

    console.log('Suggesting category for bookmark:', { title, url });
    const prompt = `Given this bookmark title and URL, suggest a single category from: Work, Personal, Shopping, News, Technology, Entertainment, Education, Finance, Travel, Social Media, Health, Reference.
    Title: "${title}"
    URL: "${url}"
    Category:`;

    const response = await aiSession.prompt(prompt);
    console.log('Suggested category:', response);
    return response.trim();
  } catch (error) {
    console.error('Error suggesting bookmark category:', error);
    throw error;
  }
};