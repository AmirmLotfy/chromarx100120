
// Configure side panel behavior on installation
chrome.runtime.onInstalled.addListener(async () => {
  // Configure the side panel to open when the action button is clicked
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  // Verify command shortcuts are registered
  checkCommandShortcuts();
});

// Listen for extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open the side panel
    await chrome.sidePanel.open({ windowId: tab.windowId });
    
    // Set side panel options
    await chrome.sidePanel.setOptions({
      enabled: true,
      path: 'index.html'
    });
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
});

// Securely handle messages from website
chrome.runtime.onMessageExternal.addListener(
  async (message, sender, sendResponse) => {
    // Verify sender origin
    const ALLOWED_ORIGIN = 'https://chromarx.it.com';
    
    if (sender.origin !== ALLOWED_ORIGIN) {
      console.error(`Invalid message origin: ${sender.origin}`);
      return;
    }

    // Handle authentication success
    if (message.type === 'AUTH_SUCCESS') {
      try {
        // Validate token structure
        if (!message.token || typeof message.token !== 'string') {
          console.error('Invalid token format received');
          return;
        }

        // Store session token securely
        await chrome.storage.local.set({
          'supabase_session': message.token,
          'auth_timestamp': Date.now()
        });

        // Notify extension about successful authentication
        chrome.runtime.sendMessage({
          type: 'AUTH_STATE_CHANGED',
          authenticated: true
        });

        // Send success response back to website
        sendResponse({ status: 'success' });
      } catch (error) {
        console.error('Error storing authentication token:', error);
        sendResponse({ status: 'error', message: 'Failed to store authentication data' });
      }
    }
  }
);

// Handle tab updates to ensure side panel is available everywhere
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    try {
      // Enable the side panel for all tabs
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'index.html',
        enabled: true
      });
    } catch (error) {
      console.error('Error setting side panel options:', error);
    }
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command, tab) => {
  switch (command) {
    case 'toggle-theme':
      // Send message to the side panel to toggle theme
      chrome.runtime.sendMessage({ type: 'TOGGLE_THEME' });
      break;
      
    case 'quick-add':
      if (tab?.url) {
        try {
          const bookmark = await chrome.bookmarks.create({
            title: tab.title || 'New Bookmark',
            url: tab.url
          });
          // Notify user of successful bookmark creation
          chrome.runtime.sendMessage({ 
            type: 'BOOKMARK_ADDED',
            bookmark
          });
        } catch (error) {
          console.error('Error creating bookmark:', error);
        }
      }
      break;
  }
});

// Check if commands are properly registered
function checkCommandShortcuts() {
  chrome.commands.getAll((commands) => {
    let missingShortcuts = [];
    
    for (let { name, shortcut } of commands) {
      if (shortcut === '') {
        missingShortcuts.push(name);
      }
    }
    
    if (missingShortcuts.length > 0) {
      console.warn('Some keyboard shortcuts were not registered:', missingShortcuts);
    }
  });
}
