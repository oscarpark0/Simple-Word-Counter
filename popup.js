// popup.js
document.getElementById('toggleTooltip').addEventListener('change', function() {
    chrome.storage.local.set({showTooltip: this.checked});
});

document.getElementById('toggleWordCount').addEventListener('change', function() {
    chrome.storage.local.set({showWordCount: this.checked});
});

document.getElementById('toggleCharCount').addEventListener('change', function() {
    chrome.storage.local.set({showCharCount: this.checked});
});

document.getElementById('toggleNewSite').addEventListener('change', function() {
    chrome.storage.local.set({newSiteDefault: this.checked});
});

// Restore checkbox states when the popup is loaded
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['showTooltip', 'showWordCount', 'showCharCount', 'newSiteDefault'], function(result) {
        document.getElementById('toggleTooltip').checked = result.showTooltip !== false; // Default to true
        document.getElementById('toggleWordCount').checked = result.showWordCount !== false; // Default to true
        document.getElementById('toggleCharCount').checked = result.showCharCount !== false; // Default to true
        document.getElementById('toggleNewSite').checked = result.newSiteDefault !== false; // Default to true

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'countWordsAndChars'}, function(response) {
                if (chrome.runtime.lastError) {
                    // Handle the error, e.g., by logging or showing a message to the user
                    console.log('Error sending message to content script:', chrome.runtime.lastError.message);
                    return;
                }
                if (response) {
                    document.getElementById('charCountDisplay').textContent = 'Words: ' + response.wordCount + ', Chars: ' + response.charCount;
                }
            });
        });
    });
});