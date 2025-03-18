
/**
 * Service Worker
 * Handles background processing using the Streams API
 */

import { handleMessage } from './utils/backgroundTaskManager';

// Register message handler
self.addEventListener('message', event => {
  // Forward to the message handler
  handleMessage(
    event.data,
    { id: 'internal' } as chrome.runtime.MessageSender,
    (response) => {
      if (response) {
        // Send response back to the client
        event.source?.postMessage(response);
      }
    }
  );
});

// Listen for Chrome extension messages
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Return true to indicate we will respond asynchronously
    return handleMessage(message, sender, sendResponse);
  });
}

console.log('Stream processing service worker initialized');
