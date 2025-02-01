export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
  try {
    const GOOGLE_SEARCH_CX = 'e0bab85862daf4c11';
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.VITE_GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}`
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