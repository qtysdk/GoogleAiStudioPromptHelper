// commands.js

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