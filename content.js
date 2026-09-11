// ==============================================================================
// Research Buddy - Content Script (DOM Manipulation & Selection Handling)
// Injected into web pages to highlight text and persist selections
// ==============================================================================

const HIGHLIGHT_CLASS = "rb-highlight-span";

// Helper: Normalize URL to match pages regardless of hash fragments (#section)
function isSamePage(url1, url2) {
  if (!url1 || !url2) return false;
  return url1.split("#")[0] === url2.split("#")[0];
}

// 1. DOM Check: Ensure selection is in readable text and not in editable inputs
function isSelectionSafe(selection) {
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return false;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return false;
  }

  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;

  if (element && element.closest("input, textarea, select, button, [contenteditable='true']")) {
    return false;
  }

  return true;
}

// 2. Event Listener: Trigger highlight when user selects text with mouse
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (!isSelectionSafe(selection)) return;

  const selectedText = selection.toString().trim();
  if (!selectedText || selectedText.length < 2) return;

  applyHighlightToSelection(selection, selectedText);
});

// 3. DOM Manipulation: Wrap selected text in a yellow <span>
function applyHighlightToSelection(selection, text) {
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const container = range.commonAncestorContainer;
  const parentElement = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;

  // Don't re-wrap if already inside an existing highlight
  if (parentElement && parentElement.closest(`.${HIGHLIGHT_CLASS}`)) {
    return;
  }

  try {
    const span = document.createElement("span");
    span.className = HIGHLIGHT_CLASS;
    span.title = "Research Buddy Highlight";

    // Extract selected DOM contents and wrap them inside the span
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);

    // Clear browser selection highlight for a clean look
    selection.removeAllRanges();

    // Save to storage
    saveHighlight(text);
  } catch (error) {
    console.warn("Research Buddy: Fallback text replacement used.", error);
    highlightTextInDocument(text);
    selection.removeAllRanges();
    saveHighlight(text);
  }
}

// 4. Data Persistence: Save highlight to chrome.storage.local
function saveHighlight(text) {
  const currentUrl = window.location.href;
  const currentTitle = document.title || "Untitled Page";
  const normalizedText = text.trim();

  if (!normalizedText) return;

  chrome.storage.local.get({ highlights: [] }, (result) => {
    const highlights = Array.isArray(result.highlights) ? result.highlights : [];

    // Avoid saving identical duplicate snippets on the exact same page
    const isDuplicate = highlights.some(
      (item) => isSamePage(item.url, currentUrl) && item.text === normalizedText
    );

    if (isDuplicate) {
      console.log("Research Buddy: Snippet already saved for this page.");
      return;
    }

    const newHighlight = {
      id: Date.now(),
      text: normalizedText,
      url: currentUrl,
      title: currentTitle,
      timestamp: new Date().toISOString()
    };

    highlights.push(newHighlight);

    chrome.storage.local.set({ highlights: highlights }, () => {
      console.log("Research Buddy: Highlight saved to chrome.storage.local.");

      // Use Chrome Message Passing to notify background or open popup
      chrome.runtime.sendMessage({ action: "highlightAdded", highlight: newHighlight }).catch(() => {
        // Safe to ignore when popup is closed
      });
    });
  });
}

// 5. Permanent Highlights: Restore saved highlights when page loads
function restoreSavedHighlights() {
  const currentUrl = window.location.href;

  chrome.storage.local.get({ highlights: [] }, (result) => {
    const allHighlights = Array.isArray(result.highlights) ? result.highlights : [];
    const pageHighlights = allHighlights.filter((item) => isSamePage(item.url, currentUrl));

    pageHighlights.forEach((item) => {
      highlightTextInDocument(item.text);
    });
  });
}

// Helper: Find text in the DOM and apply visual highlight
function highlightTextInDocument(searchText) {
  if (!searchText || searchText.length < 2) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (["script", "style", "noscript", "textarea", "input"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.classList.contains(HIGHLIGHT_CLASS)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const matchedNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.includes(searchText)) {
      matchedNodes.push(node);
      break; // Highlight matching occurrence
    }
  }

  matchedNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    const idx = textNode.nodeValue.indexOf(searchText);
    if (idx === -1) return;

    const before = textNode.nodeValue.substring(0, idx);
    const match = textNode.nodeValue.substring(idx, idx + searchText.length);
    const after = textNode.nodeValue.substring(idx + searchText.length);

    const span = document.createElement("span");
    span.className = HIGHLIGHT_CLASS;
    span.title = "Research Buddy Highlight";
    span.textContent = match;

    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));
    fragment.appendChild(span);
    if (after) fragment.appendChild(document.createTextNode(after));

    parent.replaceChild(fragment, textNode);
  });
}

// Run restoration after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", restoreSavedHighlights);
} else {
  restoreSavedHighlights();
}

// 6. Message Listener: Respond to popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentTabHighlights") {
    const currentUrl = window.location.href;
    chrome.storage.local.get({ highlights: [] }, (result) => {
      const storedHighlights = Array.isArray(result.highlights) ? result.highlights : [];
      const pageHighlights = storedHighlights.filter((item) => isSamePage(item.url, currentUrl));
      sendResponse({
        highlights: pageHighlights,
        pageUrl: currentUrl,
        pageTitle: document.title || "Current Page"
      });
    });
    return true; // Indicates async response
  }

  return false;
});
