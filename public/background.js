
// Configure side panel behavior on installation
chrome.runtime.onInstalled.addListener(async () => {
  // Configure the side panel to open when the action button is clicked
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
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
