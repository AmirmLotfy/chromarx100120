
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkList from '../BookmarkList';
import { ChromeBookmark } from '@/types/bookmark';
import { vi } from 'vitest';

const mockBookmarks: ChromeBookmark[] = [
  {
    id: '1',
    title: 'Test Bookmark 1',
    url: 'https://test1.com',
    dateAdded: 1234567890,
  },
  {
    id: '2',
    title: 'Test Bookmark 2',
    url: 'https://test2.com',
    dateAdded: 1234567891,
  }
];

const mockProps = {
  bookmarks: mockBookmarks,
  selectedBookmarks: new Set<string>(),
  onToggleSelect: vi.fn(),
  onDelete: vi.fn(),
  formatDate: (timestamp?: number) => new Date(timestamp || 0).toLocaleDateString(),
  view: 'list' as const,
  onReorder: vi.fn(),
  onUpdateCategories: vi.fn(),
};

describe('BookmarkList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all bookmarks', () => {
    render(<BookmarkList {...mockProps} />);
    
    mockBookmarks.forEach(bookmark => {
      expect(screen.getByText(bookmark.title)).toBeInTheDocument();
    });
  });

  it('handles bookmark selection', async () => {
    render(<BookmarkList {...mockProps} />);
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    await userEvent.click(checkbox);
    
    expect(mockProps.onToggleSelect).toHaveBeenCalledWith(mockBookmarks[0].id);
  });

  it('handles cleanup action', async () => {
    render(<BookmarkList {...mockProps} />);
    
    const cleanupButton = screen.getByText('Cleanup');
    await userEvent.click(cleanupButton);
    
    // Should show error toast if no bookmarks selected
    expect(await screen.findByText('Please select bookmarks to clean up')).toBeInTheDocument();
  });

  it('handles category suggestions', async () => {
    const selectedBookmarks = new Set([mockBookmarks[0].id]);
    render(<BookmarkList {...mockProps} selectedBookmarks={selectedBookmarks} />);
    
    const categorizeButton = screen.getByText('Categorize');
    await userEvent.click(categorizeButton);
    
    expect(mockProps.onUpdateCategories).toHaveBeenCalled();
  });
});
