// utils.js

// Get input content from the input element
function getInputContent(inputElement) {
    if (inputElement.tagName.toLowerCase() === 'textarea') {
        return inputElement.value;
    } else {
        return inputElement.textContent;
    }
}

// Check if the input is a slash command
function isSlashCommand(event, currentContent) {
    const slashEntered = (event.type === 'input' && event.data === '/') ||
        (event.type === 'keydown' && event.key === '/');
    return slashEntered && (currentContent.trim() === '/' || currentContent.trim() === '');
}