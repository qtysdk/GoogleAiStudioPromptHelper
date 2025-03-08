# Google AI Studio Prompt Helper ✨

This Chrome extension enhances your workflow in Google AI Studio by adding Notion-like slash commands ⌨️ for quick access to frequently used prompts and system instructions.

## Features

*   **Slash Commands:** Trigger a menu of predefined prompts by typing `/` in the input area.
*   **Customizable Prompts:** Add, edit, and delete your own custom commands and templates via the options page ⚙️.
*   **System Prompt Integration:** Easily set system prompts with a dedicated command, streamlining the process of defining the AI's behavior.
*   **Non-Destructive Restore Defaults:** Restore the default set of commands without losing any custom commands you've created. 🛡️
*   **Project Review Prompt:** Includes a default command to instruct the AI to carefully analyze project code before starting tasks. 🧐
*   **User-Friendly Interface:** Options page with a clear layout for managing commands.

## Installation

1.  Download the repository as a ZIP file or clone it:

    ```bash
    git clone git@github.com:qtysdk/GoogleAiStudioPromptHelper.git
    ```

2.  Open Chrome and navigate to `chrome://extensions/`.

3.  Enable "Developer mode" in the top right corner.

4.  Click "Load unpacked" and select the directory where you extracted or cloned the repository.

## Usage

1.  Navigate to [Google AI Studio](https://aistudio.google.com/).

2.  In any input area, type `/` to open the slash command menu.

3.  Select a command from the menu to insert its corresponding template into the input field.

4.  For system prompts, the extension will automatically open the system instructions section, insert the template, and collapse the section.

## Options

Access the extension's options page by right-clicking the extension icon in the Chrome toolbar and selecting "Options". Here you can:

*   Add new commands with names, descriptions, and templates.
*   Edit existing commands.
*   Delete commands.
*   Restore the default commands. **Note:** Restoring defaults will *only* add commands that are not already in your list; your custom commands will be preserved.

## Contributing

Contributions are welcome! 🎉 If you have ideas for new features, improvements, or bug fixes, please:

1.  Fork the repository.
2.  Create a new branch for your feature or fix.
3.  Make your changes and commit them with clear, descriptive messages.
4.  Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE). See the `LICENSE` file for details.

## Author

[qtysdk](https://github.com/qtysdk)
