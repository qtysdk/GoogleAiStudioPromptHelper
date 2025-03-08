// content.js

// Constants
const MENU_CONTAINER_CLASS = 'slash-command-menu';
const MENU_OPTION_CLASS = 'menu-option';
const SELECTED_CLASS = 'selected';
const SYSTEM_INSTRUCTIONS_SELECTOR = 'textarea[aria-label="System instructions"]';

// Cached DOM elements
let menuContainer = null;
let inputAreas = [];

// Main initialization
function init() {
    menuContainer = createMenuContainer(); // Create menu container only once
    setupSlashCommands();
    console.log('Google AI Studio Helper initialized');
}

// Setup slash commands functionality
function setupSlashCommands() {
    const newInputAreas = document.querySelectorAll('textarea, [contenteditable="true"], .ProseMirror, .cm-content');

    newInputAreas.forEach(inputArea => {
        if (!inputArea.dataset.slashCommandsInitialized) {
            console.log('Initializing slash commands for:', inputArea);
            initializeSlashCommands(inputArea);
            inputArea.dataset.slashCommandsInitialized = "true";
        }
    });

    inputAreas = Array.from(newInputAreas); // Update inputAreas
}

// Initialize slash commands for a single input element
function initializeSlashCommands(inputElement) {
    const eventHandler = createInputEventHandler(inputElement, menuContainer);

    // Add event listeners
    inputElement.addEventListener('input', eventHandler);
    inputElement.addEventListener('keydown', eventHandler);
    inputElement.addEventListener('keypress', eventHandler);
    document.addEventListener('click', eventHandler);
}

// Create the command menu container
function createMenuContainer() {
    const menuContainer = document.createElement('div');
    menuContainer.className = MENU_CONTAINER_CLASS;
    menuContainer.style.display = 'none';
    document.body.appendChild(menuContainer);
    return menuContainer;
}

// Create input event handler
function createInputEventHandler(inputElement, menuContainer) {
    return function eventHandler(e) {
        const currentContent = getInputContent(inputElement);
        const isSlashInput = isSlashCommand(e, currentContent);

        if (isSlashInput) {
            e.preventDefault();
            showSlashCommandMenu(inputElement, menuContainer);
        } else if (e.key === 'Escape' || (e.type === 'click' && menuContainer && !menuContainer.contains(e.target))) {
            hideCommandMenu(menuContainer);
        } else if (menuContainer.style.display !== 'none' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            // Ensure the input element doesn't capture arrow key events when the menu is displayed
            e.preventDefault();
        }
    };
}

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
        (event.type === 'keydown' && event.key === '/') ||
        (event.type === 'keypress' && event.key === '/');
    return slashEntered && (currentContent.trim() === '/' || currentContent.trim() === '');
}

// Show the slash command menu
function showSlashCommandMenu(inputElement, menuContainer) {
    const rect = inputElement.getBoundingClientRect();
    const lineHeight = parseInt(window.getComputedStyle(inputElement).lineHeight) || 20;
    const posTop = rect.top + lineHeight;
    const posLeft = rect.left + 20;

    chrome.storage.sync.get(['commands'], function (result) {
        const defaultCommands = [
            {
                name: 'System Prompt',
                description: 'Set system prompt',
                template: 'You are an AI assistant that specializes in [specialty]. When responding to queries about [topic], prioritize [approach].',
                isSystemPrompt: true
            },
        ];
        const commands = result.commands || defaultCommands;

        // Show Command Menu
        showCommandMenu(menuContainer, commands, posTop, posLeft, (selectedCommand) => {
            clearInputElement(inputElement);
            handleCommandSelection(inputElement, selectedCommand, menuContainer);
        });
    });
}

// Clear the content of the input element
function clearInputElement(inputElement) {
    if (inputElement.tagName.toLowerCase() === 'textarea') {
        inputElement.value = '';
    } else {
        inputElement.textContent = '';
    }
}

// Handle command selection
function handleCommandSelection(inputElement, selectedCommand, menuContainer) {
    if (selectedCommand.isSystemPrompt) {
        handleSystemPrompt(inputElement, selectedCommand);
    } else {
        insertTemplate(inputElement, selectedCommand.template, true);
    }
    hideCommandMenu(menuContainer);
}

// Function to open system prompt section if it's not visible
function openSystemPromptSection() {
    return new Promise(resolve => {
        const systemInstructionsDiv = document.querySelector('.system-instructions');

        if (!systemInstructionsDiv) {
            console.log('System Instructions div not found.');
            resolve();
            return;
        }

        const isCollapsed = systemInstructionsDiv.classList.contains('collapsed');

        if (isCollapsed) {
            // More specific button selection
            const systemButtons = Array.from(systemInstructionsDiv.querySelectorAll('button[aria-label="Collapse all System Instructions"]'));

            if (systemButtons.length > 0) {
                systemButtons[0].click();
                console.log('Opened system prompt section');
                // Introduce a short delay
                setTimeout(resolve, 250);
                return;
            } else {
                console.log('Could not find button to expand system prompt section.');
            }
        } else {
            console.log('System prompt section already opened');
        }
        resolve();
    });
}

// Function to wait for the system prompt textarea to appear
function waitForSystemPrompt(retries = 3) {
    return new Promise(resolve => {
        let systemInput = findSystemPromptInput();
        if (systemInput) {
            resolve();
            return;
        }

        let attempts = 0;

        const observer = new MutationObserver(mutations => {
            systemInput = findSystemPromptInput();
            if (systemInput) {
                observer.disconnect();
                resolve();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        function attemptFindInput() {
            attempts++;
            systemInput = findSystemPromptInput();
            if (systemInput) {
                observer.disconnect();
                resolve();
            } else if (attempts > retries) {
                observer.disconnect();
                console.log('System input not found after multiple retries.');
                resolve();
            } else {
                setTimeout(attemptFindInput, 250);
            }
        }

        // Initial attempt
        attemptFindInput();

        // Timeout after 3 seconds (still keep the timeout)
        setTimeout(() => {
            observer.disconnect();
            console.log('Timeout waiting for system input.');
            resolve();
        }, 3000);
    });
}

// Handle system prompt command
async function handleSystemPrompt(inputElement, selectedCommand) {
    await openSystemPromptSection();
    await waitForSystemPrompt();

    let systemInput = findSystemPromptInput();

    if (!systemInput) {
        console.log('System input not found after opening section.');
        return;
    }

    insertTemplate(systemInput, selectedCommand.template, false);
    inputElement.focus();

    // Collapse the section after setting the prompt
    const systemInstructionsDiv = document.querySelector('.system-instructions');
    if (systemInstructionsDiv) {
        const systemButtons = Array.from(systemInstructionsDiv.querySelectorAll('button[aria-label="Collapse all System Instructions"]'));
        if (systemButtons.length > 0) {
            systemButtons[0].click();
            console.log('Collapsed system prompt section');
        } else {
            console.log('Could not find button to collapse system prompt section.');
        }
    }
}

// Hide the command menu
function hideCommandMenu(menuContainer) {
    menuContainer.style.display = 'none';
}

// Function to find system prompt input
function findSystemPromptInput() {
    return document.querySelector(SYSTEM_INSTRUCTIONS_SELECTOR);
}

// Show command menu
function showCommandMenu(menuContainer, commands, top, left, onSelect) {
    // Clear menu
    if (!menuContainer) return;
    menuContainer.innerHTML = '';

    // Add menu title
    const titleElement = document.createElement('div');
    titleElement.className = 'menu-title';
    titleElement.textContent = 'Select Command';
    menuContainer.appendChild(titleElement);

    // Build menu options
    commands.forEach((command, index) => {
        const option = document.createElement('div');
        option.className = MENU_OPTION_CLASS;
        if (index === 0) option.classList.add(SELECTED_CLASS);

        const optionContent = `
      <div class="option-name">${command.name}</div>
      <div class="option-description">${command.description}</div>
    `;

        option.innerHTML = optionContent;

        // Click event
        option.addEventListener('click', () => {
            onSelect(command);
        });

        menuContainer.appendChild(option);
    });

    // Temporarily show to get dimensions
    menuContainer.style.visibility = 'hidden';
    menuContainer.style.display = 'block';

    // Get viewport and menu dimensions
    const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    const menuRect = menuContainer.getBoundingClientRect();

    // Adjust position to ensure menu stays within viewport
    let adjustedTop = top;
    let adjustedLeft = left;

    // Check right boundary
    if (left + menuRect.width > viewport.width) {
        adjustedLeft = viewport.width - menuRect.width - 20;
    }

    // Check bottom boundary
    if (top + menuRect.height > viewport.height) {
        adjustedTop = top - menuRect.height - 10; // Show above input
    }

    // Ensure not beyond left and top edges
    adjustedLeft = Math.max(10, adjustedLeft);
    adjustedTop = Math.max(10, adjustedTop);

    // Set final position
    requestAnimationFrame(() => {
        menuContainer.style.top = `${adjustedTop}px`;
        menuContainer.style.left = `${adjustedLeft}px`;
        menuContainer.style.visibility = 'visible';
    });

    // Create a dedicated global key handler for the menu navigation
    const menuKeyHandler = function(e) {
        if (menuContainer.style.display === 'none') {
            document.removeEventListener('keydown', menuKeyHandler);
            return;
        }

        // Handle arrow key navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent page scrolling
            e.stopPropagation(); // Prevent event bubbling to other handlers

            const options = Array.from(menuContainer.querySelectorAll('.' + MENU_OPTION_CLASS));
            const selectedOption = menuContainer.querySelector('.' + SELECTED_CLASS);
            const currentIndex = options.indexOf(selectedOption);
            let nextIndex;

            if (e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % options.length; // Cycle to the first
            } else { // ArrowUp
                nextIndex = (currentIndex - 1 + options.length) % options.length; // Cycle to the last
            }

            if (selectedOption) selectedOption.classList.remove(SELECTED_CLASS);
            options[nextIndex].classList.add(SELECTED_CLASS);
            options[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const selectedOption = menuContainer.querySelector('.' + SELECTED_CLASS);
            if (selectedOption) {
                const commandIndex = Array.from(menuContainer.querySelectorAll('.' + MENU_OPTION_CLASS)).indexOf(selectedOption);
                onSelect(commands[commandIndex]);
            }
            document.removeEventListener('keydown', menuKeyHandler);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideCommandMenu(menuContainer);
            document.removeEventListener('keydown', menuKeyHandler);
        }
    };

    // Remove any existing keydown event listeners and add the new one
    document.removeEventListener('keydown', menuKeyHandler);
    document.addEventListener('keydown', menuKeyHandler, { capture: true });
}

// Insert template into input field
function insertTemplate(inputElement, template, shouldFocus = true) {
    if (inputElement.tagName.toLowerCase() === 'textarea') {
        inputElement.value = template;
        inputElement.selectionStart = template.length;
        inputElement.selectionEnd = template.length;
        const event = new Event('input', { bubbles: true });
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

            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);
        }
    }

    if (shouldFocus) {
        inputElement.focus();
    }
}

// Initialize on both events to ensure it runs
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('load', init);

// Also try to initialize after a short delay
setTimeout(init, 1500);

// Add MutationObserver to handle dynamic content
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            setupSlashCommands();
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Content script loaded');