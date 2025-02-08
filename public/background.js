
// Listen for extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel
  await chrome.sidePanel.open({ windowId: tab.windowId });
  
  // Set side panel as default for new windows
  await chrome.sidePanel.setOptions({
    enabled: true,
    path: 'index.html'
  });
});
