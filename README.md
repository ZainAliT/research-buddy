# ✏️ Research Buddy - Web Highlighter & Note Exporter

> A lightweight Google Chrome Extension (Manifest V3) designed for researchers, students, and developers to highlight text across web pages, persist notes locally, and export them into Markdown or TXT format.

Built for **Lab 2 Mini-Hackathon: Web Extension Development**.

---

## 🌟 Key Features

- **Instant Visual Highlighting**: Select any text on any webpage with your mouse to instantly apply a clean, yellow visual highlight.
- **Permanent Persistence**: Highlights are saved locally using `chrome.storage.local` and automatically re-appear when refreshing or revisiting the page.
- **Tab-Specific Popup Interface**: The extension popup displays only the highlights belonging to your active browser tab, along with a total count and timestamps.
- **1-Click Note Export**:
  - **Export as .TXT**: Clean text summary with title, source URL, and timestamped quotes.
  - **Export as .MD**: Formatted Markdown document with blockquotes and clickable links ready for Obsidian, Notion, or GitHub.
- **Manage Snippets**: Delete individual quotes with a single click or clear all highlights on the active page.
- **No Heavy Frameworks**: Built using 100% pure Vanilla JavaScript, HTML5, and CSS3.

---

## 🏗️ Technical Architecture (Manifest V3)

| Component | File | Role & Browser APIs Used |
| :--- | :--- | :--- |
| **Manifest** | `manifest.json` | Manifest V3 configuration, permissions (`activeTab`, `storage`, `scripting`), service worker, and content scripts. |
| **Service Worker** | `background.js` | Extension lifecycle management (`chrome.runtime.onInstalled`), storage initialization, and message routing. |
| **Content Script** | `content.js` | DOM manipulation, `mouseup` selection listener, text wrapping (`<span class="rb-highlight-span">`), and highlight restoration on page load. |
| **Injected Styles** | `styles.css` | Styling for highlighted elements on web pages. |
| **Popup UI** | `popup.html` | Clean, responsive popup user interface without external libraries. |
| **Popup Script** | `popup.js` | Message Passing (`chrome.runtime.sendMessage`), active tab query, snippet rendering, and Blob file generation. |
| **Test Page** | `test_page.html` | Self-contained sample article to test extension features locally. |

---

## 🚀 Installation & Setup

1. **Clone or Download** this repository to your local machine:
   ```bash
   git clone https://github.com/ZainAliT/research-buddy.git
   ```
2. Open **Google Chrome** and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the project directory:
   ```
   Research_Buddy_Chrome_Extension_V3
   ```
6. The extension is now installed and ready to use!

> **Note for Local File Testing:** If testing on local files (e.g. `test_page.html`), click **Details** on the Research Buddy card in `chrome://extensions/` and toggle **"Allow access to file URLs"** to ON.

---

## 📖 How to Use

1. **Browse & Highlight**: Navigate to any webpage (e.g., Wikipedia, documentation, news). Select any text using your mouse cursor. The text will automatically be highlighted yellow and saved.
2. **View Saved Notes**: Click the **Research Buddy** icon in your Chrome toolbar to view all notes collected from the current page.
3. **Export Notes**: In the popup, click:
   - **📄 Export .TXT** to download a formatted `.txt` report.
   - **📑 Export .MD** to download a clean `.md` document.
4. **Delete Highlights**: Click the `×` button next to any snippet to remove it, or click **Clear All** to remove all highlights from the current page.

---

## 📁 File Structure

```text
Research_Buddy_Chrome_Extension_V3/
├── manifest.json       # Manifest V3 configuration & permissions
├── background.js       # Background Service Worker
├── content.js          # Injected content script for DOM manipulation
├── styles.css          # Injected highlighter CSS
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic & Blob note exporter
├── test_page.html      # Demo article for testing
├── icons/              # Extension icons (16px, 48px, 128px)
└── README.md           # Project documentation
```

---

## 📄 Export Sample Formats

### Markdown (`.md`)
```markdown
# 📝 Research Buddy Notes

- **Page Title:** Sample Research Paper
- **Source URL:** [https://example.com](https://example.com)
- **Export Date:** 9/11/2026, 9:30:00 PM
- **Total Highlights:** 1

---

## 📖 Saved Snippets

### Snippet 1

> "Modern extensions emphasize performance, enhanced privacy, and strict separation."

*Saved at: 9/11/2026, 9:28:15 PM*
```

---

## 👥 Authors
- Developed for **Web Design & Development Lab (Mini-Hackathon)**
- Google Chrome Extension Manifest V3
