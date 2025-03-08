// Main initialization
function init() {
  setupSlashCommands();
  // Log for debugging
  console.log('Google AI Studio Helper initialized');
}

// Main setup function
function setupSlashCommands() {
  // Find all possible input areas
  setInterval(() => {
    const inputAreas = document.querySelectorAll('textarea, [contenteditable="true"], .ProseMirror, .cm-content');
    
    inputAreas.forEach(inputArea => {
      if (!inputArea.dataset.slashCommandsInitialized) {
        console.log('Initializing slash commands for:', inputArea);
        initializeSlashCommands(inputArea);
        inputArea.dataset.slashCommandsInitialized = "true";
      }
    });
  }, 1000); // Check for new input areas every second
}

// Initialize slash command functionality
function initializeSlashCommands(inputElement) {
  // Create command menu container
  const menuContainer = document.createElement('div');
  menuContainer.className = 'slash-command-menu';
  menuContainer.style.display = 'none';
  document.body.appendChild(menuContainer);
  
  // Default commands
  const defaultCommands = [
    { 
      name: 'System Prompt', 
      description: 'Set system prompt', 
      template: 'You are an AI assistant that specializes in [specialty]. When responding to queries about [topic], prioritize [approach].',
      isSystemPrompt: true
    }
  ];
  
  // Listen for input events
  const eventHandler = (e) => {
    console.log('Input event:', e.type, e.key || e.data);
    
    // Get current input content
    let currentContent = '';
    if (inputElement.tagName.toLowerCase() === 'textarea') {
      currentContent = inputElement.value;
    } else { // contenteditable
      currentContent = inputElement.textContent;
    }
    
    // Check if the last character entered is '/' and it's the only content
    const isSlashInput = 
      ((e.type === 'input' && e.data === '/') ||
       (e.type === 'keydown' && e.key === '/') ||
       (e.type === 'keypress' && e.key === '/')) &&
      (currentContent.trim() === '/' || currentContent.trim() === '');
    
    if (isSlashInput) {
      console.log('Slash detected!');
      e.preventDefault(); // Prevent default slash input
      
      // Get cursor position
      const rect = inputElement.getBoundingClientRect();
      const lineHeight = parseInt(window.getComputedStyle(inputElement).lineHeight) || 20;
      
      // Calculate menu position
      let posTop = rect.top + lineHeight;
      let posLeft = rect.left + 20;
      
      // Get commands from storage and show menu
      chrome.storage.sync.get(['commands'], function(result) {
        const commands = result.commands || defaultCommands;
        showCommandMenu(menuContainer, commands, posTop, posLeft, (selectedCommand) => {
          // Clear the slash character first
          if (inputElement.tagName.toLowerCase() === 'textarea') {
            inputElement.value = '';
          } else {
            inputElement.textContent = '';
          }
          
          // Handle system prompt differently
          if (selectedCommand.isSystemPrompt) {
            const systemInput = findSystemPromptInput();
            if (systemInput) {
              openSystemPromptSection();
              setTimeout(() => {
                insertTemplate(systemInput, selectedCommand.template, false);
                inputElement.focus();
              }, 300);
            } else {
              openSystemPromptSection();
              setTimeout(() => {
                const newSystemInput = findSystemPromptInput();
                if (newSystemInput) {
                  insertTemplate(newSystemInput, selectedCommand.template, false);
                  inputElement.focus();
                }
              }, 300);
            }
          } else {
            // Insert other templates normally
            insertTemplate(inputElement, selectedCommand.template, true);
          }
          menuContainer.style.display = 'none';
        });
      });
    } else if (e.key === 'Escape' || (e.type === 'click' && !menuContainer.contains(e.target))) {
      // Hide menu
      menuContainer.style.display = 'none';
    }
  };
  
  // Add input event listeners
  inputElement.addEventListener('input', eventHandler);
  inputElement.addEventListener('keydown', eventHandler);
  inputElement.addEventListener('keypress', eventHandler);
  document.addEventListener('click', eventHandler);
}

// Function to find system prompt input
function findSystemPromptInput() {
  // Try different selectors that might match the system prompt input
  const systemInput = document.querySelector([
    'textarea[placeholder*="system"]',
    'textarea[placeholder*="System"]',
    'textarea[aria-label*="system"]',
    'textarea[aria-label*="System"]',
    '[contenteditable="true"][aria-label*="system"]',
    '[contenteditable="true"][aria-label*="System"]',
    // Add more selectors if needed
  ].join(','));
  
  return systemInput;
}

// Function to open system prompt section if it's not visible
function openSystemPromptSection() {
  // Try to find and click the button/element that opens system prompt
  const systemButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(button => {
    const text = button.textContent.toLowerCase();
    return text.includes('system') || text.includes('instruction');
  });
  
  if (systemButtons.length > 0) {
    systemButtons[0].click();
    console.log('Opened system prompt section');
  }
}

// Show command menu
function showCommandMenu(menuContainer, commands, top, left, onSelect) {
  // Clear menu
  menuContainer.innerHTML = '';
  
  // Set up content first to get actual dimensions
  // Add menu title
  const titleElement = document.createElement('div');
  titleElement.className = 'menu-title';
  titleElement.textContent = 'Select Command';
  menuContainer.appendChild(titleElement);
  
  // Build menu options
  commands.forEach((command, index) => {
    const option = document.createElement('div');
    option.className = 'menu-option';
    if (index === 0) option.classList.add('selected');
    
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
  menuContainer.style.top = `${adjustedTop}px`;
  menuContainer.style.left = `${adjustedLeft}px`;
  menuContainer.style.visibility = 'visible';

  // Add up/down/Enter key functionality
  document.addEventListener('keydown', function menuKeyHandler(e) {
    if (menuContainer.style.display === 'none') {
      document.removeEventListener('keydown', menuKeyHandler);
      return;
    }
    
    const selectedOption = menuContainer.querySelector('.selected');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextOption = selectedOption.nextElementSibling;
      if (nextOption && nextOption.classList.contains('menu-option')) {
        selectedOption.classList.remove('selected');
        nextOption.classList.add('selected');
        // Ensure selected item is visible
        nextOption.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevOption = selectedOption.previousElementSibling;
      if (prevOption && prevOption.classList.contains('menu-option')) {
        selectedOption.classList.remove('selected');
        prevOption.classList.add('selected');
        // Ensure selected item is visible
        prevOption.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const commandIndex = Array.from(menuContainer.querySelectorAll('.menu-option')).indexOf(selectedOption);
      onSelect(commands[commandIndex]);
      document.removeEventListener('keydown', menuKeyHandler);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      menuContainer.style.display = 'none';
      document.removeEventListener('keydown', menuKeyHandler);
    }
  });
}

// Insert template into input field
function insertTemplate(inputElement, template, shouldFocus = true) {
  if (inputElement.tagName.toLowerCase() === 'textarea') {
    // Override the entire content
    inputElement.value = template;
    
    // Set cursor position to end
    inputElement.selectionStart = template.length;
    inputElement.selectionEnd = template.length;
    
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    inputElement.dispatchEvent(event);
  } else { // contenteditable
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      // Select all content
      const range = document.createRange();
      range.selectNodeContents(inputElement);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Replace with new content
      const textNode = document.createTextNode(template);
      range.deleteContents();
      range.insertNode(textNode);
      
      // Reset selection range to after content
      range.selectNodeContents(textNode);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger change event
      const event = new Event('input', { bubbles: true });
      inputElement.dispatchEvent(event);
    }
  }
  
  // Focus the input field only if shouldFocus is true
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

// Log for debugging
console.log('Content script loaded'); 