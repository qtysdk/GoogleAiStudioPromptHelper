// commands.js

// Default commands to use when storage API fails
const DEFAULT_COMMANDS = [
    {
        name: "System Prompt",
        description: "Set system prompt",
        template: "You are an AI assistant that specializes in [specialty]. When responding to queries about [topic], prioritize [approach].",
        isSystemPrompt: true
    },
    {
        name: "Project Review",
        description: "Analyze source code before collaboration",
        template: "Please carefully analyze the attached source code to understand the project's structure, functionality, and dependencies. Wait for my instructions before proceeding.",
        isSystemPrompt: false
    }
];

// Handle command selection
function handleCommandSelection(inputElement, selectedCommand, menuContainer, onCommandComplete) {
    if (selectedCommand.isSystemPrompt) {
        handleSystemPrompt(inputElement, selectedCommand);
    } else {
        insertTemplate(inputElement, selectedCommand.template, true);
    }
    if (typeof onCommandComplete === "function") {
        onCommandComplete();
    }
}

// Insert template into input field
function insertTemplate(inputElement, template, shouldFocus = true) {
    if (inputElement.tagName.toLowerCase() === "textarea") {
        inputElement.value = template;
        inputElement.selectionStart = template.length;
        inputElement.selectionEnd = template.length;
        const event = new Event("input", { bubbles: true });
        inputElement.dispatchEvent(event);
    } else {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = document.createRange();
            range.selectNodeContents(inputElement);
            selection.removeAllRanges();
            selection.addRange(range);

            const textNode = document.createTextNode(template);
            range.deleteContents();
            range.insertNode(textNode);

            range.selectNodeContents(textNode);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            const event = new Event("input", { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }

    if (shouldFocus) {
        inputElement.focus();
    }
}

// Clear the content of the input element
function clearInputElement(inputElement) {
    if (inputElement.tagName.toLowerCase() === "textarea") {
        inputElement.value = "";
    } else {
        inputElement.textContent = "";
    }
}

