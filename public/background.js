chrome.runtime.onInstalled.addListener(async () => {
  console.log('ChroMarx installed!');

  // Example: Set a default value in storage
  chrome.storage.sync.get(['theme'], (result) => {
    if (result.theme === undefined) {
      chrome.storage.sync.set({ theme: 'light' });
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
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_THEME") {
    chrome.storage.sync.get(['theme'], (result) => {
      sendResponse({ theme: result.theme || 'light' });
    });
    return true;  // Required for asynchronous responses
  }
});

// Handle Gemini API requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GEMINI_REQUEST') {
    handleGeminiRequest(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

async function handleGeminiRequest(data) {
  try {
    // Ensure geminiService is available in the background script context
    const { geminiService } = await import(chrome.runtime.getURL('src/services/geminiService.ts'));
    const response = await geminiService.generateContent(data.prompt);
    return response;
  } catch (error) {
    console.error("Gemini request failed:", error);
    throw new Error(error.message || "Failed to generate content");
  }
}

// Add settings initialization
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize context menu
  chrome.contextMenus.create({
    id: "add-to-chromarx",
    title: "Add to ChroMarx",
    contexts: ["page", "selection"]
  });

  // Initialize Gemini API settings
  const apiKey = await chrome.storage.sync.get('gemini_api_key');
  if (!apiKey.gemini_api_key) {
    chrome.runtime.openOptionsPage();
  }
});
