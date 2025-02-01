import { getSecret } from "@/lib/chrome-utils";

export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
  try {
    // Fetch API credentials from secure storage
    const [apiKey, cx] = await Promise.all([
      getSecret('GOOGLE_SEARCH_API_KEY'),
      getSecret('GOOGLE_SEARCH_CX')
    ]);

    if (!apiKey || !cx) {
      console.error('Google Search API credentials not configured');
      return [];
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Search API error:', errorData);
      throw new Error('Failed to fetch search results');
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