import { ChromeBookmark } from "@/types/bookmark";

export const summarizeContent = async (content: string): Promise<string> => {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides concise and accurate summaries.'
          },
          {
            role: 'user',
            content: `Please summarize the following content: ${content}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error summarizing content:', error);
    throw error;
  }
};

export const summarizeBookmark = async (content: string): Promise<string> => {
  return summarizeContent(content);
};

export const suggestBookmarkCategory = async (title: string, url: string): Promise<string> => {
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('PERPLEXITY_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that suggests categories for bookmarks. Respond with just the category name.'
          },
          {
            role: 'user',
            content: `Suggest a single category for this bookmark:\nTitle: ${title}\nURL: ${url}`
          }
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw error;
  }
};