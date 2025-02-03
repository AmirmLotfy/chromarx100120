// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set initial installation data with privacy-conscious defaults
    chrome.storage.sync.set({
      installDate: new Date().toISOString(),
      hasRated: false,
      lastRatingPrompt: null,
      privacySettings: {
        dataCollection: false,
        analyticsEnabled: false,
        notificationsEnabled: true
      }
    });
  }
});

// Handle messages from content scripts with improved security
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Validate sender origin
  if (!sender.url?.startsWith('chrome-extension://')) {
    console.error('Invalid sender origin');
    return;
  }

  if (request.type === 'NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: request.title || 'ChroMarx',
      message: request.message,
      priority: 1,
      requireInteraction: false
    });
  }
  return true;
});

// Handle notification clicks with user privacy in mind
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.action.openPopup();
});

// Monitor storage changes for security
chrome.storage.onChanged.addListener((changes, namespace) => {
  // Only log non-sensitive information
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (!key.includes('password') && !key.includes('token')) {
      console.log(
        `Storage key "${key}" in namespace "${namespace}" changed.`,
        `Old value was "${oldValue}", new value is "${newValue}".`
      );
    }
  }
});

// Implement efficient keep-alive mechanism
const KEEP_ALIVE_INTERVAL = 20000; // 20 seconds
let keepAliveInterval;

const startKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  keepAliveInterval = setInterval(chrome.runtime.getPlatformInfo, KEEP_ALIVE_INTERVAL);
};

chrome.runtime.onStartup.addListener(startKeepAlive);
startKeepAlive();

// Clean up on shutdown
chrome.runtime.onSuspend.addListener(() => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});
