// Default commands
const defaultCommands = [
  { 
    name: 'System Prompt',
    description: 'Set system prompt',
    template: 'You are an AI assistant that specializes in [specialty]. When responding to queries about [topic], prioritize [approach].',
    isSystemPrompt: true
  }
];

// Load commands from storage
function loadCommands() {
  chrome.storage.sync.get(['commands'], function(result) {
    const commands = result.commands || defaultCommands;
    displayCommands(commands);
  });
}

// Display commands in the UI
function displayCommands(commands) {
  const container = document.getElementById('commandList');
  container.innerHTML = '';

  commands.forEach((command, index) => {
    const commandDiv = document.createElement('div');
    commandDiv.className = 'command-item';
    commandDiv.innerHTML = `
      <input type="text" class="command-name" value="${command.name}" placeholder="Command Name">
      <input type="text" class="command-description" value="${command.description}" placeholder="Description">
      <textarea class="command-template" placeholder="Template">${command.template}</textarea>
      <div class="checkbox-group">
        <label>
          <input type="checkbox" class="is-system-prompt" ${command.isSystemPrompt ? 'checked' : ''}>
          Is System Prompt
        </label>
      </div>
      <div class="button-group">
        <button class="delete-btn" onclick="deleteCommand(${index})">Delete</button>
      </div>
    `;
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

  chrome.storage.sync.set({ commands }, function() {
    alert('Commands saved successfully!');
  });
}

// Add new command
function addCommand() {
  const container = document.getElementById('commandList');
  const commandDiv = document.createElement('div');
  commandDiv.className = 'command-item';
  commandDiv.innerHTML = `
    <input type="text" class="command-name" placeholder="Command Name">
    <input type="text" class="command-description" placeholder="Description">
    <textarea class="command-template" placeholder="Template"></textarea>
    <div class="checkbox-group">
      <label>
        <input type="checkbox" class="is-system-prompt">
        Is System Prompt
      </label>
    </div>
    <div class="button-group">
      <button class="delete-btn" onclick="this.parentElement.parentElement.remove()">Delete</button>
    </div>
  `;
  container.appendChild(commandDiv);
}

// Delete command
function deleteCommand(index) {
  const commandItems = document.querySelectorAll('.command-item');
  commandItems[index].remove();
}

// Initialize
document.addEventListener('DOMContentLoaded', loadCommands);
document.getElementById('addCommand').addEventListener('click', addCommand);
document.getElementById('saveAll').addEventListener('click', saveCommands); 