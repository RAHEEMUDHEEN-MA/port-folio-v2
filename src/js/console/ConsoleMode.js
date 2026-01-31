/**
 * ConsoleMode - Console UI component
 * 
 * Renders a full-screen terminal interface with:
 * - Command input with prompt
 * - Output area with command history
 * - Keyboard shortcuts (Ctrl+`, Ctrl+L, Esc, ↑/↓, Tab)
 * - Integration with existing navigation
 */

import { VirtualFileSystem } from './VirtualFileSystem.js';
import { CommandParser } from './CommandParser.js';

export class ConsoleMode {
    constructor() {
        this.vfs = new VirtualFileSystem();
        this.parser = null;
        this.isVisible = false;
        this.container = null;
        this.outputArea = null;
        this.inputElement = null;
        this.promptElement = null;
        this.historyIndex = -1;
        this.initialized = false;
    }

    /**
     * Initialize console with project data
     * @param {Array} projectData - Project data from project-data.json
     */
    async initialize(projectData) {
        if (this.initialized) return;

        await this.vfs.initialize(projectData);
        this.parser = new CommandParser(this.vfs);
        this._createUI();
        this._attachEventListeners();
        this.initialized = true;

        // Show welcome message
        this._addOutput(this._getWelcomeMessage(), false);
    }

    /**
     * Create console UI elements
     * @private
     */
    _createUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'console-mode';
        this.container.setAttribute('data-visible', 'false');

        // Create console content
        const content = document.createElement('div');
        content.className = 'console-content';

        // Create output area
        this.outputArea = document.createElement('div');
        this.outputArea.className = 'console-output';

        // Create input area
        const inputArea = document.createElement('div');
        inputArea.className = 'console-input-area';

        // Create prompt
        this.promptElement = document.createElement('span');
        this.promptElement.className = 'console-prompt';
        this._updatePrompt();

        // Create input
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.inputElement.className = 'console-input';
        this.inputElement.setAttribute('autocomplete', 'off');
        this.inputElement.setAttribute('spellcheck', 'false');

        // Assemble input area
        inputArea.appendChild(this.promptElement);
        inputArea.appendChild(this.inputElement);

        // Assemble content
        content.appendChild(this.outputArea);
        content.appendChild(inputArea);

        // Assemble container
        this.container.appendChild(content);

        // Add to body
        document.body.appendChild(this.container);
    }

    /**
     * Attach event listeners
     * @private
     */
    _attachEventListeners() {
        // Input handling
        this.inputElement.addEventListener('keydown', this._handleKeyDown.bind(this));

        // Click outside to close (on backdrop)
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container) {
                this.hide();
            }
        });
    }

    /**
     * Handle keyboard input
     * @private
     */
    _handleKeyDown(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this._executeCommand();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this._navigateHistory(-1);
                break;

            case 'ArrowDown':
                e.preventDefault();
                this._navigateHistory(1);
                break;

            case 'Tab':
                e.preventDefault();
                this._handleAutocomplete();
                break;

            case 'l':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this._clearOutput();
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }

    /**
     * Execute current command
     * @private
     */
    _executeCommand() {
        const input = this.inputElement.value.trim();

        if (input.length === 0) {
            return;
        }

        // Add command to output
        this._addOutput(`${this.promptElement.textContent}${input}`, false, 'command');

        // Execute command
        const result = this.parser.execute(input);

        // Handle clear command
        if (result.clear) {
            this._clearOutput();
        } else if (result.output) {
            this._addOutput(result.output, result.error);
        }

        // Handle navigation
        if (result.navigation) {
            this._handleNavigation(result.navigation);
        }

        // Handle exit command
        if (result.exit) {
            setTimeout(() => {
                this.hide();
            }, 300);
        }

        // Update prompt (cwd might have changed)
        this._updatePrompt();

        // Clear input
        this.inputElement.value = '';
        this.historyIndex = -1;

        // Scroll to bottom
        this._scrollToBottom();
    }

    /**
     * Navigate command history
     * @private
     */
    _navigateHistory(direction) {
        const history = this.parser.getHistory();

        if (history.length === 0) return;

        if (this.historyIndex === -1) {
            // Starting from current input
            if (direction < 0) {
                this.historyIndex = history.length - 1;
                this.inputElement.value = history[this.historyIndex];
            }
        } else {
            // Navigate through history
            const newIndex = this.historyIndex + direction;

            if (newIndex >= 0 && newIndex < history.length) {
                this.historyIndex = newIndex;
                this.inputElement.value = history[this.historyIndex];
            } else if (newIndex < 0) {
                this.historyIndex = -1;
                this.inputElement.value = '';
            }
        }

        // Move cursor to end
        setTimeout(() => {
            this.inputElement.setSelectionRange(
                this.inputElement.value.length,
                this.inputElement.value.length
            );
        }, 0);
    }

    /**
     * Handle autocomplete
     * @private
     */
    _handleAutocomplete() {
        const input = this.inputElement.value;
        const suggestions = this.parser.getAutocompleteSuggestions(input);

        if (suggestions.length === 0) {
            return;
        }

        if (suggestions.length === 1) {
            // Single suggestion - autocomplete
            const parts = input.split(' ');
            parts[parts.length - 1] = suggestions[0];
            this.inputElement.value = parts.join(' ');
        } else {
            // Multiple suggestions - show them
            const output = suggestions.join('  ');
            this._addOutput(output, false);
            this._scrollToBottom();
        }
    }

    /**
     * Handle navigation commands
     * @private
     */
    _handleNavigation(navigation) {
        if (navigation.type === 'project') {
            // Navigate to project page
            setTimeout(() => {
                window.location.href = `/project.html?id=${navigation.projectId}`;
            }, 500);
        } else if (navigation.type === 'url') {
            // Open URL
            setTimeout(() => {
                window.open(navigation.url, '_blank');
            }, 500);
        }
    }

    /**
     * Add output to console
     * @private
     */
    _addOutput(text, isError = false, type = 'output') {
        const line = document.createElement('div');
        line.className = `console-line console-${type}`;

        if (isError) {
            line.classList.add('console-error');
        }

        // Preserve whitespace and line breaks
        line.textContent = text;

        this.outputArea.appendChild(line);
    }

    /**
     * Clear output area
     * @private
     */
    _clearOutput() {
        this.outputArea.innerHTML = '';
    }

    /**
     * Update prompt with current directory
     * @private
     */
    _updatePrompt() {
        const cwd = this.parser ? this.parser.getCwd() : '/';
        this.promptElement.textContent = `${cwd} $ `;
    }

    /**
     * Scroll output to bottom
     * @private
     */
    _scrollToBottom() {
        setTimeout(() => {
            this.outputArea.scrollTop = this.outputArea.scrollHeight;
        }, 0);
    }

    /**
     * Get welcome message
     * @private
     */
    _getWelcomeMessage() {
        return `Console Mode - Portfolio Filesystem

Type 'help' for available commands.
Type 'tree /' to see the filesystem structure.
Type 'list /projects' to see all projects.

Press Ctrl+\` or Esc to close.`;
    }

    /**
     * Show console
     */
    show() {
        if (!this.initialized) {
            console.error('Console not initialized');
            return;
        }

        this.isVisible = true;
        this.container.setAttribute('data-visible', 'true');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Sync toggle button
        const toggle = document.getElementById('js-console-toggle');
        if (toggle) toggle.checked = true;

        // Focus input
        setTimeout(() => {
            this.inputElement.focus();
        }, 100);
    }

    /**
     * Hide console
     */
    hide() {
        this.isVisible = false;
        this.container.setAttribute('data-visible', 'false');
        this.inputElement.blur();

        // Restore body scroll
        document.body.style.overflow = '';

        // Sync toggle button
        const toggle = document.getElementById('js-console-toggle');
        if (toggle) toggle.checked = false;
    }

    /**
     * Toggle console visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Set current working directory
     * @param {string} path - Project path
     */
    setCwd(path) {
        if (this.parser) {
            const success = this.parser.setCwd(path);
            if (success) {
                this._updatePrompt();
            }
        }
    }

    /**
     * Check if console is visible
     */
    getIsVisible() {
        return this.isVisible;
    }
}

// Singleton instance
let consoleInstance = null;

/**
 * Get or create console instance
 * @param {Array} projectData - Project data (required for first initialization)
 * @returns {Promise<ConsoleMode>}
 */
export async function getConsoleInstance(projectData = null) {
    if (!consoleInstance) {
        consoleInstance = new ConsoleMode();

        if (projectData) {
            await consoleInstance.initialize(projectData);
        }
    }

    return consoleInstance;
}

/**
 * Setup global keyboard shortcut for console activation
 * @param {Array} projectData - Project data
 */
export async function setupConsoleShortcut(projectData) {
    document.addEventListener('keydown', async (e) => {
        // Ctrl+` or Cmd+` (backtick)
        if ((e.ctrlKey || e.metaKey) && e.key === '`') {
            e.preventDefault();

            const console = await getConsoleInstance(projectData);
            console.toggle();
        }
    });
}
