(function() {
    let tooltipTimeout;

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedCreateTooltip = debounce(createTooltip, 250);

    function isExtensionContextValid() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    }

    function safelyExecuteChromeAPI(apiCall, fallback = () => {}) {
        if (isExtensionContextValid()) {
            try {
                apiCall();
            } catch (error) {
                console.error('Chrome API call failed:', error);
                fallback();
            }
        } else {
            console.log('Extension context is invalid. Skipping Chrome API call.');
            fallback();
        }
    }

    document.addEventListener('mouseup', function(e) {
        safelyExecuteChromeAPI(() => {
            chrome.storage.local.get(['showWordCount', 'showCharCount', 'showTooltip'], function(data) {
                if (chrome.runtime.lastError) {
                    console.error('An error occurred:', chrome.runtime.lastError.message);
                } else {
                    const selection = getSelectionText();
                    if (selection.text && selection.range) {
                        const wordCount = countWords(selection.text);
                        const charCount = selection.text.length;
                        if (data.showTooltip !== false && (data.showWordCount !== false || data.showCharCount !== false) && selection.text.trim() !== '') {
                            debouncedCreateTooltip(wordCount, charCount, selection.range, {x: e.clientX, y: e.clientY}, data.showWordCount, data.showCharCount);
                        }
                    }
                }
            });
        });
    });

    document.addEventListener('mousedown', function() {
        const existingTooltip = document.getElementById('wordCountTooltip');
        if (existingTooltip) {
            existingTooltip.style.opacity = '0';
            clearTimeout(tooltipTimeout);
            tooltipTimeout = setTimeout(() => existingTooltip.remove(), 300);
        }
    });

    function getSelectionText() {
        let text = "";
        let range;
        if (window.getSelection) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                text = selection.toString();
                range = selection.getRangeAt(0);
            }
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
            range = document.selection.createRange();
        }
        return {text, range};
    }

    function countWords(str) {
        return str.trim().split(/\s+/).length;
    }

    function createTooltip(wordCount, charCount, range, mousePosition, showWordCount, showCharCount) {
        let tooltip = document.getElementById('wordCountTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'wordCountTooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s';

        let content = '';
        if (showWordCount !== false) {
            content += `${chrome.i18n.getMessage('words')}: ${wordCount}<br>`;
        }
        if (showCharCount !== false) {
            content += `${chrome.i18n.getMessage('chars')}: ${charCount}`;
        }

        tooltip.innerHTML = content;

        safelyExecuteChromeAPI(() => {
            chrome.storage.local.get('darkMode', function(data) {
                updateTooltipDarkMode(tooltip, data.darkMode);
            });
        });

        // Position the tooltip off-screen to get its dimensions
        tooltip.style.left = '-9999px';
        tooltip.style.top = '-9999px';

        // Force a reflow to ensure dimensions are calculated
        tooltip.offsetHeight;

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Position tooltip so its bottom-right corner meets the cursor
        let left = mousePosition.x - tooltipWidth;
        let top = mousePosition.y - tooltipHeight;

        // Adjust if tooltip would go off-screen
        if (left < 0) left = 0;
        if (top < 0) top = 0;
        if (left + tooltipWidth > viewportWidth) left = viewportWidth - tooltipWidth;
        if (top + tooltipHeight > viewportHeight) top = viewportHeight - tooltipHeight;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });
    }

    function updateTooltipDarkMode(tooltip, isDarkMode) {
        if (isDarkMode) {
            tooltip.classList.add('dark-mode');
        } else {
            tooltip.classList.remove('dark-mode');
        }
    }

    function toggleTooltipVisibility(show) {
        const tooltip = document.getElementById('wordCountTooltip');
        if (tooltip) {
            tooltip.style.display = show ? 'block' : 'none';
        }
    }

    safelyExecuteChromeAPI(() => {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.action === 'countWordsAndChars') {
                const selection = window.getSelection().toString();
                const wordCount = countWords(selection);
                const charCount = selection.length;
                sendResponse({wordCount, charCount});
            } else if (request.action === 'togglePopup') {
                toggleTooltipVisibility(request.enable);
            }
            return true; // Indicates that the response is sent asynchronously
        });
    });

    if (chrome.runtime && chrome.runtime.onInstalled) {
        chrome.runtime.onInstalled.addListener(function(details) {
            if (details.reason === 'update') {
                console.log('Extension updated. Reloading page to ensure functionality.');
                window.location.reload();
            }
        });
    } else {
    }

    safelyExecuteChromeAPI(() => {
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if (namespace === 'local' && 'darkMode' in changes) {
                const tooltip = document.getElementById('wordCountTooltip');
                if (tooltip) {
                    updateTooltipDarkMode(tooltip, changes.darkMode.newValue);
                }
            }
        });
    });
})();
