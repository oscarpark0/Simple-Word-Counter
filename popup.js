// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const tooltipCheckbox = document.getElementById('tooltip');
    const wordCountCheckbox = document.getElementById('word-count');
    const charCountCheckbox = document.getElementById('char-count');
    const defaultBehaviorCheckbox = document.getElementById('default-behavior');
    const darkModeCheckbox = document.getElementById('darkMode');

    function handleRuntimeError() {
        if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError.message);
            if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
                console.log('Extension context invalidated. The popup will close.');
                window.close();
            }
        }
    }

    function sendMessageToActiveTab(message) {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (chrome.runtime.lastError) {
                    return reject(new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`));
                }
                if (tabs.length === 0) {
                    return reject(new Error('No active tab found'));
                }
                chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
                    if (chrome.runtime.lastError) {
                        if (chrome.runtime.lastError.message.includes('Receiving end does not exist')) {
                            reject(new Error('Content script not ready. Please refresh the page.'));
                        } else {
                            reject(new Error(`Error sending message: ${chrome.runtime.lastError.message}`));
                        }
                    } else if (response === undefined) {
                        reject(new Error('No response received from content script'));
                    } else {
                        resolve(response);
                    }
                });
            });
        });
    }

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

    const debouncedSendMessage = debounce((message) => {
        sendMessageToActiveTab(message).catch(error => console.error('Error sending message:', error));
    }, 250);

    function getLocalizedString(messageName) {
        return chrome.i18n.getMessage(messageName);
    }

    if (tooltipCheckbox) {
        tooltipCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            chrome.storage.local.set({showTooltip: isChecked});
            debouncedSendMessage({action: 'togglePopup', enable: isChecked});
        });
    }

    if (wordCountCheckbox) {
        wordCountCheckbox.addEventListener('change', function() {
            chrome.storage.local.set({showWordCount: this.checked});
        });
    }

    if (charCountCheckbox) {
        charCountCheckbox.addEventListener('change', function() {
            chrome.storage.local.set({showCharCount: this.checked});
        });
    }

    if (defaultBehaviorCheckbox) {
        defaultBehaviorCheckbox.addEventListener('change', function() {
            chrome.storage.local.set({newSiteDefault: this.checked});
        });
    }

    if (darkModeCheckbox) {
        darkModeCheckbox.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }

    chrome.storage.local.get(['showTooltip', 'showWordCount', 'showCharCount', 'newSiteDefault', 'darkMode'], function(result) {
        handleRuntimeError();
        if (chrome.runtime.lastError) {
            console.error('Error retrieving settings:', chrome.runtime.lastError);
            return;
        }
        if (tooltipCheckbox) tooltipCheckbox.checked = result.showTooltip !== false;
        if (wordCountCheckbox) wordCountCheckbox.checked = result.showWordCount !== false;
        if (charCountCheckbox) charCountCheckbox.checked = result.showCharCount !== false;
        if (defaultBehaviorCheckbox) defaultBehaviorCheckbox.checked = result.newSiteDefault !== false;
        if (darkModeCheckbox) {
            darkModeCheckbox.checked = result.darkMode === true;
            toggleDarkMode(result.darkMode);
        }

        updateWordAndCharCount();
    });

    function toggleDarkMode(enable) {
        document.body.classList.toggle('dark-mode', enable);
        chrome.storage.local.set({darkMode: enable});
    }

    function updateWordAndCharCount() {
        sendMessageToActiveTab({action: 'countWordsAndChars'})
            .then(response => {
                if (response) {
                    const charCountDisplay = document.getElementById('charCountDisplay');
                    if (charCountDisplay) {
                        charCountDisplay.textContent = `${getLocalizedString('words')}: ${response.wordCount}, ${getLocalizedString('chars')}: ${response.charCount}`;
                    }
                }
            })
            .catch(error => {
                console.error('Error getting word and char count:', error);
                const charCountDisplay = document.getElementById('charCountDisplay');
                if (charCountDisplay) {
                    if (error.message.includes('Content script not ready')) {
                        charCountDisplay.textContent = getLocalizedString('refreshPage');
                    } else {
                        charCountDisplay.textContent = getLocalizedString('errorCounting');
                    }
                }
            });
    }

    function updatePopupContent(wordCount, charCount, showWordCount, showCharCount) {
        const wordCountDisplay = document.getElementById('wordCountDisplay');
        const charCountDisplay = document.getElementById('charCountDisplay');

        if (wordCountDisplay && charCountDisplay) {
            wordCountDisplay.textContent = showWordCount ? `${getLocalizedString('words')}: ${wordCount}` : '';
            charCountDisplay.textContent = showCharCount ? `${getLocalizedString('chars')}: ${charCount}` : '';
        } else {
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
                <p id="wordCountDisplay">${showWordCount ? `${getLocalizedString('words')}: ${wordCount}` : ''}</p>
                <p id="charCountDisplay">${showCharCount ? `${getLocalizedString('chars')}: ${charCount}` : ''}</p>
            `;
            document.body.appendChild(popupContent);
        }
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updatePopup') {
            updatePopupContent(request.wordCount, request.charCount, request.showWordCount, request.showCharCount);
        }
    });
});
