const SEARCH_ENGINE_ID = 'e0bab85862daf4c11';

export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
  try {
    // Use chrome.identity to get OAuth token
    const token = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    if (!response.ok) {
      console.error('Search API error:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
    })) || [];
  } catch (error) {
    console.error('Error searching web results:', error);
    return [];
  }
};