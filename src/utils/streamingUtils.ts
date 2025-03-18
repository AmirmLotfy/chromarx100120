
import { geminiService } from '@/services/geminiService';

export const streamingAnimationFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export const processStreamingData = async (text: string): Promise<string> => {
  try {
    return await geminiService.summarize(text);
  } catch (error) {
    console.error('Error processing streaming data:', error);
    return 'Failed to process streaming data';
  }
};

export const analyzeStreamContent = async (content: string, type: 'sentiment' | 'keywords' | 'entities'): Promise<string> => {
  try {
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
    
    return await geminiService.getResponse(prompt);
  } catch (error) {
    console.error(`Error analyzing stream content (${type}):`, error);
    return '';
  }
};
