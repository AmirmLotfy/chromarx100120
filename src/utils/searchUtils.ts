const GOOGLE_SEARCH_API_KEY = localStorage.getItem('GOOGLE_SEARCH_API_KEY');
const GOOGLE_SEARCH_CX = localStorage.getItem('GOOGLE_SEARCH_CX');

export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
    }));
  } catch (error) {
    console.error('Error searching web results:', error);
    return [];
  }
};