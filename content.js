document.addEventListener('mouseup', function(e) {
    chrome.storage.local.get(['showWordCount', 'showCharCount'], function(data) {
        if (chrome.runtime.lastError) {
            console.log('An error occurred: ' + chrome.runtime.lastError.message);
        } else {
            var selection = getSelectionText();
            if (selection.text && selection.range) {
                var wordCount = countWords(selection.text);
                var charCount = selection.text.length;
                // Only create tooltip if at least one feature is enabled
                if ((data.showWordCount !== false || data.showCharCount !== false) && (wordCount > 0 || charCount > 0)) {
                    createTooltip(wordCount, charCount, selection.range, {x: e.clientX, y: e.clientY}, data.showWordCount, data.showCharCount);
                }
            }
        }
    });
});

document.addEventListener('mousedown', function() {
    var existingTooltip = document.getElementById('wordCountTooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
});

function getSelectionText() {
    var text = "";
    var range;
    if (window.getSelection) {
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            text = selection.toString();
            range = selection.getRangeAt(0);
        }
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
        range = document.selection.createRange();
    }
    return {text: text, range: range};
}

function countWords(str) {
    return str.trim().split(/\s+/).length;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'countWordsAndChars') {
        if (!sender.tab) {
            var text = window.getSelection().toString();
            var wordCount = countWords(text);
            var charCount = text.length;
            // Check if sendResponse is still a function (i.e., context is still valid)
            if (typeof sendResponse === 'function') {
                sendResponse({wordCount: wordCount, charCount: charCount});
            }
        }
        return true; // Keep the message channel open for asynchronous response
    }
});

function createTooltip(wordCount, charCount, range, mousePosition, showWordCount, showCharCount) {
    // Create tooltip element first to ensure it exists
    var tooltip = document.createElement('div');
    tooltip.id = 'wordCountTooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.backgroundColor = '#f9f9f9';
    tooltip.style.padding = '5px 10px'; 
    tooltip.style.border = '1px solid #707070'; 
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontFamily = 'Helvetica, Arial, sans-serif'; 
    tooltip.style.fontSize = '14px';
    tooltip.style.zIndex = '9999'; // Set a high z-index

    // Initialize content variable
    var content = '';
    if (showWordCount !== false) {
        content += 'Words: ' + wordCount + '<br>';
    }
    if (showCharCount !== false) {
        content += 'Chars: ' + charCount;
    }

    // Now that tooltip is defined, set its innerHTML
    tooltip.innerHTML = content;

    // Append tooltip to the body to calculate dimensions
    document.body.appendChild(tooltip);

    // Calculate and adjust tooltip position
    var tooltipWidth = tooltip.offsetWidth;
    var tooltipHeight = tooltip.offsetHeight;
    tooltip.style.left = (mousePosition.x - tooltipWidth - 5) + 'px';
    tooltip.style.top = (mousePosition.y - tooltipHeight - 5) + 'px'; 
}