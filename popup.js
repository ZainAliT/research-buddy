// ==============================================================================
// Research Buddy - Popup Script (Manifest V3)
// Communicates with Content Script & Background Worker to display & export notes
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const pageTitleEl = document.getElementById("page-title");
  const badgeCountEl = document.getElementById("badge-count");
  const emptyStateEl = document.getElementById("empty-state");
  const highlightsListEl = document.getElementById("highlights-list");
  const btnClearAll = document.getElementById("btn-clear-all");
  const btnExportTxt = document.getElementById("btn-export-txt");
  const btnExportMd = document.getElementById("btn-export-md");
  const statusToastEl = document.getElementById("status-toast");

  let currentTabHighlights = [];
  let currentPageTitle = "";
  let currentPageUrl = "";

  // Helper: Normalize URL to compare across anchors (#)
  function isSamePage(url1, url2) {
    if (!url1 || !url2) return false;
    return url1.split("#")[0] === url2.split("#")[0];
  }

  // 1. Get the Active Tab and load highlights via Message Passing
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      pageTitleEl.textContent = "No active tab detected";
      return;
    }

    const activeTab = tabs[0];
    currentPageUrl = activeTab.url || "";
    currentPageTitle = activeTab.title || "Webpage";
    pageTitleEl.textContent = currentPageTitle;

    // Send message using Chrome Message Passing API (chrome.runtime.sendMessage)
    chrome.runtime.sendMessage(
      { action: "getCurrentTabHighlights", tabId: activeTab.id },
      (response) => {
        // If message passing encountered an error (e.g. content script not yet loaded), fallback to storage
        if (chrome.runtime.lastError || !response || response.error) {
          console.log("Research Buddy: Fetching directly from chrome.storage.local as fallback.");
          loadFromStorage(currentPageUrl);
          return;
        }

        currentTabHighlights = Array.isArray(response.highlights) ? response.highlights : [];
        if (response.pageTitle) currentPageTitle = response.pageTitle;
        if (response.pageUrl) currentPageUrl = response.pageUrl;

        pageTitleEl.textContent = currentPageTitle;
        renderHighlights(currentTabHighlights);
      }
    );
  });

  // 2. Direct Storage Fallback (Reads chrome.storage.local)
  function loadFromStorage(activeUrl) {
    chrome.storage.local.get({ highlights: [] }, (result) => {
      const allHighlights = Array.isArray(result.highlights) ? result.highlights : [];
      currentTabHighlights = allHighlights.filter((item) => isSamePage(item.url, activeUrl));
      renderHighlights(currentTabHighlights);
    });
  }

  // 3. Render highlights list into Popup UI
  function renderHighlights(highlights) {
    highlightsListEl.innerHTML = "";

    const count = highlights.length;
    badgeCountEl.textContent = `${count} ${count === 1 ? "Note" : "Notes"}`;

    if (count === 0) {
      emptyStateEl.style.display = "block";
      btnClearAll.style.display = "none";
      btnExportTxt.disabled = true;
      btnExportMd.disabled = true;
      return;
    }

    emptyStateEl.style.display = "none";
    btnClearAll.style.display = "inline";
    btnExportTxt.disabled = false;
    btnExportMd.disabled = false;

    // Build cards for each saved highlight
    highlights.forEach((item) => {
      const card = document.createElement("div");
      card.className = "highlight-card";

      const textDiv = document.createElement("div");
      textDiv.className = "highlight-text";
      textDiv.textContent = `“${item.text}”`;

      const metaDiv = document.createElement("div");
      metaDiv.className = "highlight-meta";

      const timeSpan = document.createElement("span");
      const dateObj = new Date(item.timestamp);
      timeSpan.textContent = isNaN(dateObj) ? "Just now" : dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      // Single item delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-delete-item";
      deleteBtn.title = "Delete highlight";
      deleteBtn.innerHTML = "&times;";
      deleteBtn.addEventListener("click", () => {
        deleteHighlight(item.id);
      });

      metaDiv.appendChild(timeSpan);
      metaDiv.appendChild(deleteBtn);

      card.appendChild(textDiv);
      card.appendChild(metaDiv);
      highlightsListEl.appendChild(card);
    });
  }

  // 4. Delete single highlight
  function deleteHighlight(highlightId) {
    chrome.storage.local.get({ highlights: [] }, (result) => {
      const allHighlights = Array.isArray(result.highlights) ? result.highlights : [];
      const updated = allHighlights.filter((item) => item.id !== highlightId);

      chrome.storage.local.set({ highlights: updated }, () => {
        currentTabHighlights = currentTabHighlights.filter((item) => item.id !== highlightId);
        renderHighlights(currentTabHighlights);
        showToast("Highlight deleted.");
      });
    });
  }

  // 5. Clear all highlights for the active webpage
  btnClearAll.addEventListener("click", () => {
    if (currentTabHighlights.length === 0) return;

    if (confirm("Delete all highlights saved for this page?")) {
      chrome.storage.local.get({ highlights: [] }, (result) => {
        const allHighlights = Array.isArray(result.highlights) ? result.highlights : [];
        const remaining = allHighlights.filter((item) => !isSamePage(item.url, currentPageUrl));

        chrome.storage.local.set({ highlights: remaining }, () => {
          currentTabHighlights = [];
          renderHighlights(currentTabHighlights);
          showToast("All highlights for this page cleared.");
        });
      });
    }
  });

  // 6. Export as Plain Text (.txt) using JavaScript Blob
  btnExportTxt.addEventListener("click", () => {
    if (currentTabHighlights.length === 0) return;

    let content = "=================================================\n";
    content += "   RESEARCH BUDDY - HIGHLIGHTS REPORT\n";
    content += "=================================================\n\n";
    content += `Source Page: ${currentPageTitle}\n`;
    content += `Source URL:  ${currentPageUrl}\n`;
    content += `Export Date: ${new Date().toLocaleString()}\n`;
    content += `Total Notes: ${currentTabHighlights.length}\n\n`;
    content += "----------------- SAVED NOTES -------------------\n\n";

    currentTabHighlights.forEach((item, index) => {
      content += `[${index + 1}] "${item.text}"\n`;
      content += `    Saved: ${new Date(item.timestamp).toLocaleString()}\n\n`;
    });

    content += "=================================================\n";
    content += "Exported with Research Buddy Chrome Extension\n";

    downloadFile(content, "text/plain", "research_notes.txt");
    showToast("Downloaded research_notes.txt!");
  });

  // 7. Export as Markdown (.md) using JavaScript Blob
  btnExportMd.addEventListener("click", () => {
    if (currentTabHighlights.length === 0) return;

    let md = `# 📝 Research Buddy Notes\n\n`;
    md += `- **Page Title:** ${currentPageTitle}\n`;
    md += `- **Source URL:** [${currentPageUrl}](${currentPageUrl})\n`;
    md += `- **Export Date:** ${new Date().toLocaleString()}\n`;
    md += `- **Total Highlights:** ${currentTabHighlights.length}\n\n`;
    md += `---\n\n## 📖 Saved Snippets\n\n`;

    currentTabHighlights.forEach((item, index) => {
      md += `### Snippet ${index + 1}\n\n`;
      md += `> "${item.text}"\n\n`;
      md += `*Saved at: ${new Date(item.timestamp).toLocaleString()}*\n\n`;
    });

    md += `---\n*Generated by Research Buddy Chrome Extension*\n`;

    downloadFile(md, "text/markdown", "research_notes.md");
    showToast("Downloaded research_notes.md!");
  });

  // 8. Utility: Download Blob file
  function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = filename;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up memory
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  // 9. Toast notification helper
  function showToast(message) {
    statusToastEl.textContent = message;
    statusToastEl.style.display = "block";
    setTimeout(() => {
      statusToastEl.style.display = "none";
    }, 2500);
  }

  // 10. Real-time message listener for highlights added while popup is open
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "highlightAdded" && message.highlight) {
      if (isSamePage(message.highlight.url, currentPageUrl)) {
        currentTabHighlights.push(message.highlight);
        renderHighlights(currentTabHighlights);
        showToast("New highlight captured!");
      }
    }
  });
});
