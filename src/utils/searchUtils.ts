
export const searchWebResults = async (query: string): Promise<Array<{ title: string; url: string }>> => {
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
};
