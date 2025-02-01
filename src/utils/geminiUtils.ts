import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

let aiSession: chrome.aiOriginTrial.AILanguageModelSession | null = null;
let aiSummarizer: chrome.aiOriginTrial.AISummarizer | null = null;
let aiLanguageDetector: chrome.aiOriginTrial.AILanguageDetector | null = null;

interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

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
    return null;
  } catch (error) {
    console.error('Error initializing AI session:', error);
    return null;
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
    return null;
  } catch (error) {
    console.error('Error initializing summarizer:', error);
    return null;
  }
};

const initializeLanguageDetector = async () => {
  try {
    if (chrome?.aiOriginTrial?.languageDetector) {
      const capabilities = await chrome.aiOriginTrial.languageDetector.capabilities();
      
      if (capabilities.available !== 'no') {
        console.log('Using Chrome Language Detector API');
        const detector = await chrome.aiOriginTrial.languageDetector.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e: DownloadProgressEvent) => {
              console.log(`Language detector model download progress: ${e.loaded}/${e.total} bytes`);
            });
          }
        });
        await detector.ready;
        return detector;
      }
    }
    return null;
  } catch (error) {
    console.error('Error initializing language detector:', error);
    return null;
  }
};

export const summarizeContent = async (content: string, language: string = 'en'): Promise<string> => {
  try {
    if (!aiSummarizer) {
      aiSummarizer = await initializeSummarizer();
    }

    if (aiSummarizer) {
      const summary = await aiSummarizer.summarize(content);
      return summary;
    }

    // Fallback to using Gemini API for summarization
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Please provide a concise summary of the following content in ${language}:

${content}

Summary:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

// Rename summarizeContent to summarizeBookmark for consistency
export const summarizeBookmark = summarizeContent;

export const suggestBookmarkCategory = async (title: string, url: string, language: string = 'en'): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Given the following bookmark title and URL, suggest a single category that best describes it. Respond with ONLY the category name in ${language}, using one of these categories: Work, Personal, Shopping, News, Technology, Entertainment, Education, Finance, Travel, Social Media, Health, Reference.

Title: "${title}"
URL: "${url}"

Category:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error suggesting bookmark category:', error);
    throw error;
  }
};