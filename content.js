// content.js

// Constants
const MENU_CONTAINER_CLASS = 'slash-command-menu';
const MENU_OPTION_CLASS = 'menu-option';
const SELECTED_CLASS = 'selected';
const SYSTEM_INSTRUCTIONS_SELECTOR = 'textarea[aria-label="System instructions"]';

// Default commands to use when storage API fails
const DEFAULT_COMMANDS = [
    {
        name: 'System Prompt',
        description: 'Set system prompt',
        template: 'You are an AI assistant that specializes in [specialty]. When responding to queries about [topic], prioritize [approach].',
        isSystemPrompt: true
    },
    {
        name: 'Project Review',
        description: 'Analyze source code before collaboration',
        template: "Please carefully analyze the attached source code to understand the project's structure, functionality, and dependencies. Wait for my instructions before proceeding.",
        isSystemPrompt: false
    }
];

// Cached DOM elements
let menuContainer = null;
let inputAreas = [];

let isToastActive = false;
// Store initialized elements and their cleanup functions
const initializedElements = new WeakMap();

// Global event handlers reference for cleanup
let globalEventHandlers = [];

// Main initialization
function init() {
    // Only initialize once
    if (menuContainer) {
        console.log('Google AI Studio Helper already initialized');
        return;
    }
    menuContainer = createMenuContainer(); // Create menu container only once
    setupSlashCommands();
    console.log('Google AI Studio Helper initialized');

    // Add cleanup on page unload
    window.addEventListener('unload', cleanup);
}

// Function to show a toast message
function showToast(message) {
    if (isToastActive) return;
    isToastActive = true;

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 100000;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
        isToastActive = false;
    }, 10000);
}
// Global cleanup function
function cleanup() {
    console.log('Cleaning up Google AI Studio Helper resources');

    // Clean up any global event handlers
    globalEventHandlers.forEach(handler => {
        document.removeEventListener('keydown', handler.fn, handler.options);
        document.removeEventListener('click', handler.fn, handler.options);
    });
    globalEventHandlers = [];

    // Stop the observer
    if (window.__aiStudioObserver) {
        window.__aiStudioObserver.disconnect();
        window.__aiStudioObserver = null;
    }

    // Remove the menu container
    if (menuContainer && menuContainer.parentNode) {
        menuContainer.parentNode.removeChild(menuContainer);
        menuContainer = null;
    }
}

// Setup slash commands functionality
function setupSlashCommands() {
    const newInputAreas = document.querySelectorAll('textarea, [contenteditable="true"], .ProseMirror, .cm-content');

    // Check for any removed elements and clean them up
    inputAreas.forEach(oldInput => {
        if (!document.body.contains(oldInput) && initializedElements.has(oldInput)) {
            // Call cleanup function for this element
            const cleanup = initializedElements.get(oldInput);
            if (typeof cleanup === 'function') {
                cleanup();
            }
            initializedElements.delete(oldInput);
        }
    });

    // Initialize new elements
    newInputAreas.forEach(inputArea => {
        if (!initializedElements.has(inputArea)) {
            console.log('Initializing slash commands for:', inputArea);
            const cleanup = initializeSlashCommands(inputArea);
            initializedElements.set(inputArea, cleanup);
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

    // Return cleanup function
    return function cleanupInputElement() {
        console.log('Cleaning up event listeners for input element');
        inputElement.removeEventListener('input', eventHandler);
        inputElement.removeEventListener('keydown', eventHandler);
    };
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
        } else if (e.key === 'Escape') {
            hideCommandMenu(menuContainer);
        } else if (menuContainer && menuContainer.style.display !== 'none' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            // Ensure the input element doesn't capture arrow key events when the menu is displayed
            e.preventDefault();
        }
    };
}

// Document click handler (used separately for proper management)
function handleDocumentClick(e) {
    if (menuContainer && menuContainer.style.display !== 'none' && !menuContainer.contains(e.target)) {
        hideCommandMenu(menuContainer);
    }
}

// Register document click handler with tracking for cleanup
function registerDocumentClickHandler() {
    // Remove any existing handler first to prevent duplicates
    unregisterDocumentClickHandler();

    // Add the click handler with tracking
    document.addEventListener('click', handleDocumentClick);
    globalEventHandlers.push({
        fn: handleDocumentClick,
        options: false
    });
}

// Unregister document click handler
function unregisterDocumentClickHandler() {
    globalEventHandlers = globalEventHandlers.filter(handler => {
        if (handler.fn === handleDocumentClick) {
            document.removeEventListener('click', handler.fn, handler.options);
            return false;
        }
        return true;
    });
}


// Show the slash command menu
function showSlashCommandMenu(inputElement, menuContainer) {
    const rect = inputElement.getBoundingClientRect();

    if (!menuContainer) {
        showToast('Google AI Studio Helper Error: Please reload the page.');
        return;
    }

    const lineHeight = parseInt(window.getComputedStyle(inputElement).lineHeight) || 20;
    const posTop = rect.top + lineHeight;
    const posLeft = rect.left + 20;

    // Register document click handler when showing the menu
    registerDocumentClickHandler();

    // FIX: Wrap in try-catch and use DEFAULT_COMMANDS as fallback if storage API fails
    try {
        chrome.storage.sync.get(['commands'], function(result) {
            try {
                // Show Command Menu with stored commands or defaults
                const commands = result.commands || DEFAULT_COMMANDS;
                showCommandMenu(menuContainer, commands, posTop, posLeft, (selectedCommand) => {
                    clearInputElement(inputElement);
                    handleCommandSelection(inputElement, selectedCommand, menuContainer);
                });
            } catch (innerError) {
                console.error('Error processing commands:', innerError);
                // Fallback to default commands
                showCommandMenu(menuContainer, DEFAULT_COMMANDS, posTop, posLeft, (selectedCommand) => {
                    clearInputElement(inputElement);
                    handleCommandSelection(inputElement, selectedCommand, menuContainer);
                });
            }
        });
    } catch (error) {
        console.error('Failed to access chrome.storage:', error);
        // Fallback to default commands when storage API completely fails
        showCommandMenu(menuContainer, DEFAULT_COMMANDS, posTop, posLeft, (selectedCommand) => {
            clearInputElement(inputElement);
            handleCommandSelection(inputElement, selectedCommand, menuContainer);
        });
    }
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
        let timeoutId = null;
        const observer = new MutationObserver(mutations => {
            systemInput = findSystemPromptInput();
            if (systemInput) {
                observer.disconnect();
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
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
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
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
        timeoutId = setTimeout(() => {
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

    // Clean up document click handler when hiding the menu
    unregisterDocumentClickHandler();
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
            // Clean up the handler if menu is no longer visible
            removeMenuKeyHandler(menuKeyHandler);
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
            removeMenuKeyHandler(menuKeyHandler);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hideCommandMenu(menuContainer);
            removeMenuKeyHandler(menuKeyHandler);
        }
    };

    // Register the menuKeyHandler with proper tracking
    registerMenuKeyHandler(menuKeyHandler);
}

// Register menu key handler with tracking for cleanup
function registerMenuKeyHandler(handler) {
    // Remove any prior menu key handlers to prevent duplicates
    globalEventHandlers = globalEventHandlers.filter(h => {
        if (h.type === 'menuKeyHandler') {
            document.removeEventListener('keydown', h.fn, h.options);
            return false;
        }
        return true;
    });

    // Add the new handler with tracking info
    document.addEventListener('keydown', handler, { capture: true });
    globalEventHandlers.push({
        fn: handler,
        options: { capture: true },
        type: 'menuKeyHandler'
    });
}

// Remove a specific menu key handler
function removeMenuKeyHandler(handler) {
    document.removeEventListener('keydown', handler, { capture: true });
    globalEventHandlers = globalEventHandlers.filter(h => h.fn !== handler);
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
window.__aiStudioObserver = new MutationObserver((mutations) => {
    let hasRelevantChanges = false;

    // Check if any mutation contains input elements we care about
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // Element node
                    // Check if the node is an input element or contains input elements
                    if (node.matches('textarea, [contenteditable="true"], .ProseMirror, .cm-content') ||
                        node.querySelector('textarea, [contenteditable="true"], .ProseMirror, .cm-content')) {
                        hasRelevantChanges = true;
                        break;
                    }
                }
            }
        }

        if (hasRelevantChanges) break;
    }

    // Only call setupSlashCommands if we found relevant changes
    if (hasRelevantChanges) {
        setupSlashCommands();
    }
});

window.__aiStudioObserver.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Content script loaded');