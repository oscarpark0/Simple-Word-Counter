// options.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');

    var wordCountCheckbox = document.getElementById('toggleWordCount');
    var charCountCheckbox = document.getElementById('toggleCharCount');
    var darkModeCheckbox = document.getElementById('darkMode');

    // Function to get localized strings
    function getLocalizedString(messageName) {
        const message = chrome.i18n.getMessage(messageName);
        console.log(`Localizing ${messageName}: ${message}`);
        return message || messageName;
    }

    // Localize the page title
    document.title = `${getLocalizedString('extName')} - ${getLocalizedString('settings')}`;
    console.log('Page title set:', document.title);

    // Localize labels
    const elements = {
        'h1': 'settings',
        'label[for="toggleWordCount"]': 'showWordCount',
        'label[for="toggleCharCount"]': 'showCharCount',
        'label[for="darkMode"]:not(.switch)': 'darkMode'
    };

    for (const [selector, messageName] of Object.entries(elements)) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = getLocalizedString(messageName);
            console.log(`Set ${selector} text to:`, element.textContent);
        } else {
            console.error(`Element not found: ${selector}`);
        }
    }

    // Load saved data and update checkboxes
    chrome.storage.local.get(['showWordCount', 'showCharCount', 'darkMode'], function(data) {
        wordCountCheckbox.checked = data.showWordCount !== false; // Default to true
        charCountCheckbox.checked = data.showCharCount !== false; // Default to true
        darkModeCheckbox.checked = data.darkMode === true;
        toggleDarkMode(darkModeCheckbox.checked);
    });

    // Save data when checkboxes change
    wordCountCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({'showWordCount': wordCountCheckbox.checked});
    });

    charCountCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({'showCharCount': charCountCheckbox.checked});
    });

    darkModeCheckbox.addEventListener('change', function() {
        toggleDarkMode(darkModeCheckbox.checked);
        chrome.storage.local.set({'darkMode': darkModeCheckbox.checked});
    });

    function toggleDarkMode(enable) {
        if (enable) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
});
