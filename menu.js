// menu.js

// Constants
const MENU_CONTAINER_CLASS = "slash-command-menu";
const MENU_OPTION_CLASS = "menu-option";
const SELECTED_CLASS = "selected";

// Global event handlers reference for cleanup
let menuKeyHandlers = [];

// Create the command menu container
function createMenuContainer() {
    const menuContainer = document.createElement("div");
    menuContainer.className = MENU_CONTAINER_CLASS;
    menuContainer.style.display = "none";
    document.body.appendChild(menuContainer);
    return menuContainer;
}

// Position the menu within viewport bounds
function positionMenu(menuContainer, top, left) {
    // Temporarily show to get dimensions
    menuContainer.style.visibility = "hidden";
    menuContainer.style.display = "block";

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
        menuContainer.style.visibility = "visible";
    });
}

// Show command menu
function showCommandMenu(menuContainer, commands, top, left, inputElement) {
    // Clear menu
    if (!menuContainer) return;
    menuContainer.innerHTML = "";

    // Add menu title
    const titleElement = document.createElement("div");
    titleElement.className = "menu-title";
    titleElement.textContent = "Select Command";
    menuContainer.appendChild(titleElement);

    // Build menu options
    commands.forEach((command, index) => {
        const option = document.createElement("div");
        option.className = MENU_OPTION_CLASS;
        if (index === 0) option.classList.add(SELECTED_CLASS);

        const optionContent = `
      <div class="option-name">${command.name}</div>
      <div class="option-description">${command.description}</div>
    `;

        option.innerHTML = optionContent;

        // Click event
        option.addEventListener("click", () => {
            // We need to use the global functions directly
            clearInputElement(inputElement);
            handleCommandSelection(inputElement, command, menuContainer, () => hideCommandMenu(menuContainer));
        });

        menuContainer.appendChild(option);
    });

    // Position menu
    positionMenu(menuContainer, top, left);
    
    // Create a dedicated key handler for the menu navigation
    const menuKeyHandler = function(e) {
        if (menuContainer.style.display === "none") {
            // Clean up the handler if menu is no longer visible
            removeMenuKeyHandler(menuKeyHandler);
            return;
        }

        // Handle arrow key navigation
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault(); // Prevent page scrolling
            e.stopPropagation(); // Prevent event bubbling to other handlers

            const options = Array.from(menuContainer.querySelectorAll("." + MENU_OPTION_CLASS));
            const selectedOption = menuContainer.querySelector("." + SELECTED_CLASS);
            const currentIndex = options.indexOf(selectedOption);
            let nextIndex;

            if (e.key === "ArrowDown") {
                nextIndex = (currentIndex + 1) % options.length; // Cycle to the first
            } else { // ArrowUp
                nextIndex = (currentIndex - 1 + options.length) % options.length; // Cycle to the last
            }

            if (selectedOption) selectedOption.classList.remove(SELECTED_CLASS);
            options[nextIndex].classList.add(SELECTED_CLASS);
            options[nextIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            const selectedOption = menuContainer.querySelector("." + SELECTED_CLASS);
            if (selectedOption) {
                const commandIndex = Array.from(menuContainer.querySelectorAll("." + MENU_OPTION_CLASS)).indexOf(selectedOption);
                clearInputElement(inputElement);
                handleCommandSelection(inputElement, commands[commandIndex], menuContainer, () => hideCommandMenu(menuContainer));
            }
            removeMenuKeyHandler(menuKeyHandler);
        } else if (e.key === "Escape") {
            e.preventDefault();
            hideCommandMenu(menuContainer);
            removeMenuKeyHandler(menuKeyHandler);
        }
    };

    // Register the menuKeyHandler
    registerMenuKeyHandler(menuKeyHandler);
}

// Register menu key handler
function registerMenuKeyHandler(handler) {
    // Clean up any existing handlers
    cleanupMenuKeyHandlers();
    
    // Add the new handler
    document.addEventListener("keydown", handler, { capture: true });
    menuKeyHandlers.push(handler);
}

// Remove a specific menu key handler
function removeMenuKeyHandler(handler) {
    document.removeEventListener("keydown", handler, { capture: true });
    menuKeyHandlers = menuKeyHandlers.filter(h => h !== handler);
}

// Clean up all menu key handlers
function cleanupMenuKeyHandlers() {
    menuKeyHandlers.forEach(handler => {
        document.removeEventListener("keydown", handler, { capture: true });
    });
    menuKeyHandlers = [];
}

// Hide the command menu
function hideCommandMenu(menuContainer) {
    if (menuContainer) {
        menuContainer.style.display = "none";
    }
    cleanupMenuKeyHandlers();
}

// Show the slash command menu
function showSlashCommandMenu(inputElement, menuContainer) {
    const rect = inputElement.getBoundingClientRect();

    if (!menuContainer) {
        showToast("Google AI Studio Helper Error: Please reload the page.");
        return;
    }

    const lineHeight = parseInt(window.getComputedStyle(inputElement).lineHeight) || 20;
    const posTop = rect.top + lineHeight;
    const posLeft = rect.left + 20;

    // Register document click handler when showing the menu
    registerDocumentClickHandler(menuContainer);

    // FIX: Wrap in try-catch and use DEFAULT_COMMANDS as fallback if storage API fails
    try {
        chrome.storage.sync.get(["commands"], function(result) {
            try {
                // Show Command Menu with stored commands or defaults
                const commands = result.commands || DEFAULT_COMMANDS;
                showCommandMenu(menuContainer, commands, posTop, posLeft, inputElement);
            } catch (innerError) {
                console.error("Error processing commands:", innerError);
                // Fallback to default commands
                showCommandMenu(menuContainer, DEFAULT_COMMANDS, posTop, posLeft, inputElement);
            }
        });
    } catch (error) {
        console.error("Failed to access chrome.storage:", error);
        // Fallback to default commands when storage API completely fails
        showCommandMenu(menuContainer, DEFAULT_COMMANDS, posTop, posLeft, inputElement);
    }
}

