// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set initial installation data
    chrome.storage.sync.set({
      installDate: new Date().toISOString(),
      hasRated: false,
      lastRatingPrompt: null
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: request.title || 'ChroMarx',
      message: request.message,
      priority: 1
    });
  }
  return true;
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open the extension popup when notification is clicked
  chrome.action.openPopup();
});

// Handle chrome.storage errors
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});

// Keep service worker alive
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();