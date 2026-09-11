// ==============================================================================
// Research Buddy - Background Service Worker (Manifest V3)
// Handles extension lifecycle events and message routing
// ==============================================================================

// 1. Lifecycle Event: Triggers when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Research Buddy: Background Service Worker initialized.");
  
  if (details.reason === "install") {
    console.log("Research Buddy: First-time install detected. Initializing storage.");
    // Initialize default storage structure
    chrome.storage.local.set({ highlights: [] }, () => {
      console.log("Research Buddy: Default storage initialized.");
    });
  }
});

// 2. Message Passing Listener: Handles communication between Popup and Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Action: Relay request to fetch highlights from the active tab's content script
  if (request.action === "getCurrentTabHighlights") {
    const tabId = request.tabId;

    if (!tabId) {
      sendResponse({ highlights: [], pageUrl: "", pageTitle: "" });
      return false;
    }

    // Forward message to the content script in the specified tab
    chrome.tabs.sendMessage(tabId, { action: "getCurrentTabHighlights" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "Research Buddy: Could not reach content script (tab might be a restricted Chrome page or freshly opened).",
          chrome.runtime.lastError.message
        );
        sendResponse({ highlights: [], pageUrl: "", pageTitle: "", error: chrome.runtime.lastError.message });
        return;
      }

      sendResponse(response || { highlights: [], pageUrl: "", pageTitle: "" });
    });

    // Return true to indicate asynchronous response handling
    return true;
  }

  // Action: Optional notification when a new highlight is created in content script
  if (request.action === "highlightAdded") {
    console.log("Research Buddy: New highlight saved on:", request.highlight?.url);
    // Return false as no async response is needed
    return false;
  }

  return false;
});
