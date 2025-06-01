import { colorfulLog } from '@extension/shared';

colorfulLog(
  'background script initialized',
  'info', // Specify the log type
);

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Handle download events
chrome.downloads.onChanged.addListener(downloadDelta => {
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    console.log('Download completed:', downloadDelta.id);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_FILE') {
    chrome.downloads
      .download({
        url: message.url,
        filename: message.filename,
        saveAs: false,
      })
      .then(downloadId => {
        sendResponse({ success: true, downloadId });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  return false; // Ensure all code paths return a value
});

// Handle tab updates to inject content scripts if needed
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Tab finished loading
    console.log('Tab updated:', tab.url);
  }
});
