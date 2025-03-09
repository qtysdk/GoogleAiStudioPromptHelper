// content.js - Main script that integrates all modules

// Cached DOM elements
let menuContainer = null;
let inputAreas = [];

// Store initialized elements and their cleanup functions
const initializedElements = new WeakMap();

// Main initialization
function init() {
  // Only initialize once
  if (menuContainer) {
    console.log("Google AI Studio Helper already initialized");
    return;
  }
  menuContainer = createMenuContainer();
  setupSlashCommands();
  console.log("Google AI Studio Helper initialized");

  // Add cleanup on page unload
  window.addEventListener("unload", cleanup);
}

// Global cleanup function
function cleanup() {
  console.log("Cleaning up Google AI Studio Helper resources");

  // Clean up event handlers
  cleanupEventHandlers();

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
  const newInputAreas = document.querySelectorAll(
    'textarea, [contenteditable="true"], .ProseMirror, .cm-content'
  );
  const newInputAreasArray = Array.from(newInputAreas); // Convert to array for easier indexing

  // Clean up ALL previously initialized elements
  inputAreas.forEach((oldInput) => {
    if (initializedElements.has(oldInput)) {
      const cleanup = initializedElements.get(oldInput);
      if (typeof cleanup === "function") {
        cleanup();
      }
      initializedElements.delete(oldInput);
    }
  });

  // Function to handle the "Upload Python POC" command
  window.handleUploadPythonPOC = function (inputElement, selectedCommand) {
    // 创建Python hello world文件
    const pythonContent = 'print("Hello, World!")';
    const pythonFile = new File([pythonContent], "hello.py", {
      type: "text/x-python",
    });

    // 创建DataTransfer对象并添加文件
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(pythonFile);

    // 创建drop事件
    const dropEvent = new Event("drop", { bubbles: true, cancelable: true });

    // 添加dataTransfer到事件对象
    Object.defineProperty(dropEvent, "dataTransfer", {
      value: dataTransfer,
      writable: false,
    });

    // 假设textarea的选择器，需要根据实际情况替换
    const textareaSelector = "textarea"; // 替换为实际的选择器
    //const textarea = document.querySelector(textareaSelector);

    // 触发drop事件
    inputElement.dispatchEvent(dropEvent);

    console.log("已模拟上传Python文件:", pythonFile.name);
  };

  // Initialize ONLY the last element, if any
  if (newInputAreasArray.length > 0) {
    const lastInputArea = newInputAreasArray[newInputAreasArray.length - 1];

    console.log(
      "Initializing slash commands for last input area:",
      lastInputArea
    );
    const cleanup = initializeSlashCommands(lastInputArea);
    initializedElements.set(lastInputArea, cleanup);
  }

  inputAreas =
    newInputAreasArray.length > 0
      ? [newInputAreasArray[newInputAreasArray.length - 1]]
      : []; // Update inputAreas to only contain the last element, or be empty if there are no elements
}

// Initialize slash commands for a single input element
function initializeSlashCommands(inputElement) {
  const eventHandler = createInputEventHandler(inputElement, menuContainer);

  // Add event listeners
  inputElement.addEventListener("input", eventHandler);
  inputElement.addEventListener("keydown", eventHandler);

  // Return cleanup function
  return function cleanupInputElement() {
    console.log("Cleaning up event listeners for input element");
    inputElement.removeEventListener("input", eventHandler);
    inputElement.removeEventListener("keydown", eventHandler);
  };
}

// Initialize on both events to ensure it runs
document.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", init);

// Also try to initialize after a short delay
setTimeout(init, 1500);

// Add MutationObserver to handle dynamic content
window.__aiStudioObserver = new MutationObserver((mutations) => {
  let hasRelevantChanges = false;

  // Check if any mutation contains input elements we care about
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          // Element node
          // Check if the node is an input element or contains input elements
          if (
            node.matches(
              'textarea, [contenteditable="true"], .ProseMirror, .cm-content'
            ) ||
            node.querySelector(
              'textarea, [contenteditable="true"], .ProseMirror, .cm-content'
            )
          ) {
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
  subtree: true,
});

console.log("Content script loaded");
