
import { test, expect } from '@playwright/test';

test.describe('Bookmark Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set up chrome storage mock
    await page.addInitScript(() => {
      window.chrome = {
        storage: {
          sync: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          }
        },
        bookmarks: {
          getRecent: () => Promise.resolve([
            {
              id: '1',
              title: 'Test Bookmark',
              url: 'https://test.com',
              dateAdded: Date.now()
            }
          ])
        }
      } as any;
    });
    
    await page.goto('chrome-extension://local/index.html');
  });

  test('should display bookmarks', async ({ page }) => {
    await expect(page.getByText('Test Bookmark')).toBeVisible();
    await expect(page.getByText('https://test.com')).toBeVisible();
  });

  test('should allow bookmark selection', async ({ page }) => {
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('should show categorize button when bookmarks selected', async ({ page }) => {
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.click();
    const categorizeButton = page.getByText('Categorize');
    await expect(categorizeButton).toBeEnabled();
  });

  test('should handle cleanup action', async ({ page }) => {
    const checkbox = page.getByRole('checkbox').first();
    await checkbox.click();
    const cleanupButton = page.getByText('Cleanup');
    await cleanupButton.click();
    await expect(page.getByText('Cleanup completed successfully')).toBeVisible();
  });
});
