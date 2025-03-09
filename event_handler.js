// event_handler.js

// Global event handlers reference for cleanup
let globalEventHandlers = [];

// Create input event handler
function createInputEventHandler(inputElement, menuContainer) {
    return function eventHandler(e) {
        const currentContent = getInputContent(inputElement);
        const isSlashInput = isSlashCommand(e, currentContent);

        if (isSlashInput) {
            e.preventDefault();
            showSlashCommandMenu(inputElement, menuContainer);
        } else if (e.key === "Escape") {
            hideCommandMenu(menuContainer);
        } else if (menuContainer && menuContainer.style.display !== "none" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            // Ensure the input element doesn't capture arrow key events when the menu is displayed
            e.preventDefault();
        }
    };
}

// Document click handler
function handleDocumentClick(e, menuContainer) {
    if (menuContainer && menuContainer.style.display !== "none" && !menuContainer.contains(e.target)) {
        hideCommandMenu(menuContainer);
    }
}

// Register document click handler with tracking for cleanup
function registerDocumentClickHandler(menuContainer) {
    // Remove any existing handler first to prevent duplicates
    unregisterDocumentClickHandler();

    // Add the click handler with tracking
    const boundHandler = function(e) {
        handleDocumentClick(e, menuContainer);
    };
    document.addEventListener("click", boundHandler);
    globalEventHandlers.push({
        type: "click",
        fn: boundHandler,
        options: false
    });
}

// Unregister document click handler
function unregisterDocumentClickHandler() {
    globalEventHandlers = globalEventHandlers.filter(handler => {
        if (handler.type === "click") {
            document.removeEventListener("click", handler.fn, handler.options);
            return false;
        }
        return true;
    });
}

// Clean up all event handlers
function cleanupEventHandlers() {
    globalEventHandlers.forEach(handler => {
        document.removeEventListener(handler.type, handler.fn, handler.options);
    });
    globalEventHandlers = [];
    
    // Also clean up menu key handlers
    cleanupMenuKeyHandlers();
}

