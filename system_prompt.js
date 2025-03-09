// system_prompt.js

// Constants
const SYSTEM_INSTRUCTIONS_SELECTOR = 'textarea[aria-label="System instructions"]';

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

// Function to find system prompt input
function findSystemPromptInput() {
    return document.querySelector(SYSTEM_INSTRUCTIONS_SELECTOR);
}