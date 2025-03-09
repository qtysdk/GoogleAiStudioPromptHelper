// Default commands
const defaultCommands = [
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

// Load commands from storage
function loadCommands() {
  try {
    chrome.storage.sync.get(['commands'], function(result) {
      try {
        const commands = result.commands || []; // Start with an empty array if nothing is stored
        displayCommands(commands);
      } catch (e) {
        console.error("Error processing commands from storage:", e);
        showToast("Error processing commands from storage. Loading defaults.");
        displayCommands(defaultCommands);
      }
    });
  } catch (e) {
    console.error("Error accessing chrome.storage.sync:", e);
    showToast("Error accessing storage. Loading defaults.");
    displayCommands(defaultCommands);
  }
}

// Display commands in the UI
function displayCommands(commands) {
  const container = document.getElementById('commandList');
  container.innerHTML = '';

  commands.forEach((command, index) => {
    const commandDiv = document.createElement('div');
    commandDiv.className = 'command-item';
    let commandHTML = '';
    commandHTML += '<input type="text" class="command-name" value="' + command.name + '" placeholder="Command Name">';
    commandHTML += '<input type="text" class="command-description" value="' + command.description + '" placeholder="Description">';
    commandHTML += '<textarea class="command-template" placeholder="Template">' + command.template + '</textarea>';
    commandHTML += '<div class="checkbox-group">';
    commandHTML += '<label>';
    commandHTML += '<input type="checkbox" class="is-system-prompt" ' + (command.isSystemPrompt ? 'checked' : '') + '>';
    commandHTML += 'Is System Prompt';
    commandHTML += '</label>';
    commandHTML += '</div>';
    commandHTML += '<div class="button-group">';
    commandHTML += '<button class="delete-btn" data-index="' + index + '">Delete</button>';
    commandHTML += '</div>';
    commandDiv.innerHTML = commandHTML;
    container.appendChild(commandDiv);
  });
}

// Save all commands
function saveCommands() {
  const commandItems = document.querySelectorAll('.command-item');
  const commands = Array.from(commandItems).map(item => ({
    name: item.querySelector('.command-name').value,
    description: item.querySelector('.command-description').value,
    template: item.querySelector('.command-template').value,
    isSystemPrompt: item.querySelector('.is-system-prompt').checked
  }));

  try {
    chrome.storage.sync.set({ commands }, function() {
      if (chrome.runtime.lastError) {
        console.error("Error saving commands:", chrome.runtime.lastError);
        showToast("Error saving commands to storage.");
      } else {
        showToast('Commands saved successfully!');
      }
      loadCommands(); // Reload to reflect changes
    });
  } catch (e) {
    console.error("Error accessing chrome.storage.sync:", e);
    showToast("Error accessing storage. Commands not saved.");
  }
}

// Add new command
function addCommand() {
  const container = document.getElementById('commandList');
  const commandDiv = document.createElement('div');
  commandDiv.className = 'command-item';
  let commandHTML = '';
  commandHTML += '<input type="text" class="command-name" placeholder="Command Name">';
  commandHTML += '<input type="text" class="command-description" placeholder="Description">';
  commandHTML += '<textarea class="command-template" placeholder="Template"></textarea>';
  commandHTML += '<div class="checkbox-group">';
  commandHTML += '<label>';
  commandHTML += '<input type="checkbox" class="is-system-prompt">';
  commandHTML += 'Is System Prompt';
  commandHTML += '</label>';
  commandHTML += '</div>';
  commandHTML += '<div class="button-group">';
  commandHTML += '<button class="delete-btn" onclick="this.parentElement.parentElement.remove()">Delete</button>';
  commandHTML += '</div>';
  commandDiv.innerHTML = commandHTML;
  container.appendChild(commandDiv);
}

// Delete command
function deleteCommand(index) {
  try {
    chrome.storage.sync.get(['commands'], function (result) {
      try {
        let commands = result.commands || [];
        commands.splice(index, 1);
        chrome.storage.sync.set({ commands: commands }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error deleting command:", chrome.runtime.lastError);
            showToast("Error deleting command from storage.");
          } else {
            showToast('Command deleted successfully!');
          }
          loadCommands(); // Reload to reflect changes
        });
      } catch (e) {
        console.error("Error processing commands:", e);
        showToast("Error processing commands. Deletion failed.");
      }
    });
  } catch (e) {
    console.error("Error accessing chrome.storage.sync:", e);
    showToast("Error accessing storage. Deletion failed.");
  }
}

// Restore Defaults
function restoreDefaults() {
  try {
    chrome.storage.sync.get(['commands'], function(result) {
      try {
        let existingCommands = result.commands || [];
        const existingCommandNames = existingCommands.map(cmd => cmd.name);

        let newCommandsAdded = false;
        defaultCommands.forEach(defaultCommand => {
          if (!existingCommandNames.includes(defaultCommand.name)) {
            existingCommands.push(defaultCommand);
            newCommandsAdded = true;
          }
        });

        chrome.storage.sync.set({ commands: existingCommands }, function() {
          if (chrome.runtime.lastError) {
            console.error("Error restoring defaults:", chrome.runtime.lastError);
            showToast("Error restoring default commands.");
          } else {
            if (newCommandsAdded) {
              showToast('Default commands restored (if missing)!');
            } else {
              showToast('No missing default commands found.');
            }
          }
          loadCommands(); // Reload to reflect changes
        });
      } catch (e) {
        console.error("Error processing commands:", e);
        showToast("Error processing commands. Restore defaults failed.");
      }
    });
  } catch (e) {
    console.error("Error accessing chrome.storage.sync:", e);
    showToast("Error accessing storage. Restore defaults failed.");
  }
}

// Attach event listeners to dynamically created delete buttons
function attachDeleteListeners() {
  const container = document.getElementById('commandList');
  container.addEventListener('click', function(event) {
    if (event.target.classList.contains('delete-btn')) {
      const index = event.target.dataset.index;
      deleteCommand(index);
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', loadCommands);
document.addEventListener('DOMContentLoaded', attachDeleteListeners);
document.getElementById('addCommand').addEventListener('click', addCommand);
document.getElementById('saveAll').addEventListener('click', saveCommands);
document.getElementById('restoreDefaults').addEventListener('click', restoreDefaults);
