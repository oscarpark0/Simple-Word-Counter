// options.js
document.addEventListener('DOMContentLoaded', function() {
    var wordCountCheckbox = document.getElementById('toggleWordCount');
    var charCountCheckbox = document.getElementById('toggleCharCount');

    // Load saved data and update checkboxes
    chrome.storage.local.get(['showWordCount', 'showCharCount'], function(data) {
        wordCountCheckbox.checked = data.showWordCount !== true; // Default to true
        charCountCheckbox.checked = data.showCharCount !== true; // Default to true
    });

    // Save data when checkboxes change
    wordCountCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({'showWordCount': wordCountCheckbox.checked});
    });

    charCountCheckbox.addEventListener('change', function() {
        chrome.storage.local.set({'showCharCount': charCountCheckbox.checked});
    });
});