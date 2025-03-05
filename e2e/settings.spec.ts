
import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up chrome storage and permission mocks
    await page.addInitScript(() => {
      window.chrome = {
        storage: {
          sync: {
            get: (key) => {
              if (key === 'settings-storage') {
                return Promise.resolve({
                  'settings-storage': JSON.stringify({
                    state: {
                      theme: 'dark',
                      language: 'en',
                      notifications: true,
                      autoSave: true,
                      compactView: false,
                      historyRetention: true,
                      localStorageEncryption: false,
                      historyItems: 5
                    }
                  })
                });
              }
              return Promise.resolve({});
            },
            set: () => Promise.resolve()
          }
        },
        permissions: {
          contains: () => Promise.resolve(true),
          request: () => Promise.resolve(true),
          remove: () => Promise.resolve(true),
          getAll: () => Promise.resolve({
            permissions: ['storage', 'bookmarks'],
            origins: []
          })
        },
        runtime: {
          getManifest: () => ({
            name: 'ChroMarx',
            version: '1.1.0',
            permissions: ['storage', 'bookmarks', 'sidePanel', 'tabs']
          }),
          lastError: null
        }
      } as any;
    });
    
    await page.goto('chrome-extension://local/index.html#/settings');
  });

  test('should display data security settings', async ({ page }) => {
    // Navigate to data security settings
    await page.getByText('Data Security').click();
    
    // Check that important elements are displayed
    await expect(page.getByText('Data Protection')).toBeVisible();
    await expect(page.getByText('History Retention')).toBeVisible();
    await expect(page.getByText('Local Storage Encryption')).toBeVisible();
    await expect(page.getByText('Export Your Data')).toBeVisible();
    await expect(page.getByText('Delete All Data')).toBeVisible();
  });

  test('should toggle history retention setting', async ({ page }) => {
    // Navigate to data security settings
    await page.getByText('Data Security').click();
    
    // Find and toggle the history retention switch
    const historySwitch = page.locator('label[for="history-retention"]').locator('xpath=../..').locator('span[role="switch"]');
    await historySwitch.click();
    
    // Check for the success toast
    await expect(page.getByText('History retention disabled')).toBeVisible();
    
    // Toggle it back
    await historySwitch.click();
    await expect(page.getByText('History retention enabled')).toBeVisible();
  });

  test('should handle delete all data dialog', async ({ page }) => {
    // Navigate to data security settings
    await page.getByText('Data Security').click();
    
    // Click the delete all data button
    await page.getByText('Delete All Data').click();
    
    // Check that the confirmation dialog appears
    await expect(page.getByText('Are you absolutely sure you want to continue?')).toBeVisible();
    
    // Cancel the operation
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Dialog should disappear
    await expect(page.getByText('Are you absolutely sure you want to continue?')).not.toBeVisible();
  });

  test('should handle exporting data', async ({ page }) => {
    // Navigate to data security settings
    await page.getByText('Data Security').click();
    
    // Mock the download behavior
    const downloadPromise = page.waitForEvent('download');
    
    // Click export data button
    await page.getByText('Export Your Data').click();
    
    // Wait for the download to start
    await downloadPromise;
    
    // Check for success toast
    await expect(page.getByText('Data exported successfully')).toBeVisible();
  });
});
