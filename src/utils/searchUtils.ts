
const SEARCH_ENGINE_ID = 'e0bab85862daf4c11';

export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
  try {
    // Development mode - return mock results
    return [
      {
        title: 'Mock Search Result 1',
        url: 'https://example.com/1',
      },
      {
        title: 'Mock Search Result 2', 
        url: 'https://example.com/2',
      },
    ];
  } catch (error) {
    console.error('Error searching web results:', error);
    return [];
  }
};
