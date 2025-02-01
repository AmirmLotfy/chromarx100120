export const summarizeContent = async (content: string): Promise<string> => {
  try {
    console.log('Summarizing content:', content);
    // For now, return a simple summary until Chrome AI APIs are properly integrated
    return `Summary of: ${content.substring(0, 100)}...`;
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
    console.log('Suggesting category for:', { title, url });
    // For now, return a simple category until Chrome AI APIs are properly integrated
    if (url.includes('github')) return 'Development';
    if (url.includes('docs')) return 'Documentation';
    return 'General';
  } catch (error) {
    console.error('Error suggesting category:', error);
    throw error;
  }
};
