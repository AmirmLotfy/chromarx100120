
import { geminiService } from '@/services/geminiService';

export const streamingAnimationFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Helper for retrying API calls
const retry = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = RETRY_DELAY): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retrying streaming operation (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retry(fn, retries - 1, delay * 2);
  }
};

export const processStreamingData = async (text: string): Promise<string> => {
  try {
    // Check for offline mode
    if (geminiService.isOffline && geminiService.isOffline()) {
      return 'Cannot process content while offline';
    }
    
    return await retry(() => geminiService.summarize(text));
  } catch (error) {
    console.error('Error processing streaming data:', error);
    return 'Failed to process streaming data';
  }
};

export const analyzeStreamContent = async (content: string, type: 'sentiment' | 'keywords' | 'entities'): Promise<string> => {
  try {
    // Check for offline mode
    if (geminiService.isOffline && geminiService.isOffline()) {
      return type === 'sentiment' ? 'neutral' : '';
    }
    
    let prompt = '';
    
    switch (type) {
      case 'sentiment':
        prompt = `Analyze the sentiment of this text. Return only 'positive', 'negative', or 'neutral': ${content}`;
        break;
      case 'keywords':
        prompt = `Extract 5 key keywords from this text. Return them as a comma-separated list: ${content}`;
        break;
      case 'entities':
        prompt = `Extract named entities (people, places, organizations) from this text. Return them as a comma-separated list: ${content}`;
        break;
    }
    
    return await retry(() => geminiService.getResponse(prompt));
  } catch (error) {
    console.error(`Error analyzing stream content (${type}):`, error);
    return type === 'sentiment' ? 'neutral' : '';
  }
};
