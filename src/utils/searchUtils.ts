export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
  try {
    const GOOGLE_SEARCH_CX = 'e0bab85862daf4c11';
    let apiKey;

    // Try to get API key from Chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get(['googleApiKey']);
      apiKey = result.googleApiKey;
    } else {
      // Fallback for development environment
      apiKey = localStorage.getItem('googleApiKey');
    }

    if (!apiKey) {
      console.error('Google API key not found');
      return [];
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}`
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

export const setGoogleApiKey = async (key: string): Promise<void> => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ googleApiKey: key });
    } else {
      localStorage.setItem('googleApiKey', key);
    }
  } catch (error) {
    console.error('Error saving Google API key:', error);
    throw error;
  }
};