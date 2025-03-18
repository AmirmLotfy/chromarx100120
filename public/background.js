
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ChroMarx installed!');

  // Initialize default settings
  chrome.storage.sync.get(['theme'], (result) => {
    if (result.theme === undefined) {
      chrome.storage.sync.set({ theme: 'light' });
    }
  });

  // Initialize PayPal configuration
  chrome.storage.sync.get(['paypal_config'], (result) => {
    if (!result.paypal_config) {
      chrome.storage.sync.set({ 
        paypal_config: { 
          clientId: '', 
          mode: 'sandbox' 
        } 
      });
    }
  });

  // Initialize context menu
  chrome.contextMenus.create({
    id: "add-to-chromarx",
    title: "Add to ChroMarx",
    contexts: ["page", "selection"]
  });

  // Open options page on install
  chrome.runtime.openOptionsPage();
});

// Listen for theme toggle command
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-theme") {
    chrome.storage.sync.get(['theme'], (result) => {
      const newTheme = result.theme === 'light' ? 'dark' : 'light';
      chrome.storage.sync.set({ theme: newTheme });
    });
  }
  if (command === "quick-add") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab) {
        // Send a message to the content script to add the bookmark
        chrome.tabs.sendMessage(currentTab.id, { type: "ADD_BOOKMARK" });
      }
    });
  }
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener((data, tab) => {
  if (data.menuItemId === "add-to-chromarx") {
    // Send a message to the content script to add the bookmark
    chrome.tabs.sendMessage(tab.id, { type: "ADD_BOOKMARK" });
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.theme) {
    // Notify all tabs about the theme change
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'THEME_CHANGED',
          theme: changes.theme.newValue
        });
      });
    });
  }

  // Notify about PayPal config changes
  if (areaName === 'sync' && changes.paypal_config) {
    console.log('PayPal configuration updated');
    chrome.runtime.sendMessage({
      type: 'PAYPAL_CONFIG_UPDATED',
      config: changes.paypal_config.newValue
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_THEME") {
    chrome.storage.sync.get(['theme'], (result) => {
      sendResponse({ theme: result.theme || 'light' });
    });
    return true;  // Required for asynchronous responses
  }

  // Handle PayPal config requests
  if (request.type === "GET_PAYPAL_CONFIG") {
    chrome.storage.sync.get(['paypal_config'], (result) => {
      sendResponse({ config: result.paypal_config || { clientId: '', mode: 'sandbox' } });
    });
    return true;
  }

  if (request.type === "SAVE_PAYPAL_CONFIG") {
    try {
      chrome.storage.sync.set({ 'paypal_config': request.config }, () => {
        sendResponse({ success: true });
      });
    } catch (error) {
      console.error("Error saving PayPal config:", error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

// Remove references to Gemini API and Supabase
