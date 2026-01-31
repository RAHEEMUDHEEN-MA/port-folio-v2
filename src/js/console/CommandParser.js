/**
 * CommandParser - Parse and execute console commands
 * 
 * Supports canonical commands and aliases:
 * - list/ls - List directory contents
 * - open/cd - Navigate to path
 * - read/cat - Read file contents
 * - tree - Display tree structure
 * - search - Search for keyword
 * - help - Display help
 * - clear - Clear console
 */

export class CommandParser {
    constructor(vfs) {
        this.vfs = vfs;
        this.cwd = '/';
        this.history = [];

        // Command aliases
        this.aliases = {
            'ls': 'list',
            'cd': 'open',
            'cat': 'read',
            'dir': 'list',
            'pwd': 'cwd',
            'quit': 'exit'
        };

        // Command handlers
        this.commands = {
            'list': this.cmdList.bind(this),
            'open': this.cmdOpen.bind(this),
            'read': this.cmdRead.bind(this),
            'tree': this.cmdTree.bind(this),
            'search': this.cmdSearch.bind(this),
            'help': this.cmdHelp.bind(this),
            'clear': this.cmdClear.bind(this),
            'cwd': this.cmdCwd.bind(this),
            'exit': this.cmdExit.bind(this)
        };
    }

    /**
     * Parse and execute a command
     * @param {string} input - Raw command input
     * @returns {Object} Command result with output and metadata
     */
    execute(input) {
        if (!input || input.trim().length === 0) {
            return { output: '', error: false };
        }

        const trimmed = input.trim();
        this.history.push(trimmed);

        // Check for shell features that are not supported
        if (this._containsShellFeatures(trimmed)) {
            return {
                output: 'Error: shell features are not supported. This console exposes a read-only portfolio system.',
                error: true
            };
        }

        const { command, args } = this._parseCommand(trimmed);

        // Resolve alias
        const canonicalCommand = this.aliases[command] || command;

        // Check if command exists
        if (!this.commands[canonicalCommand]) {
            return {
                output: `Error: unknown command: ${command}. Type 'help' for available commands.`,
                error: true
            };
        }

        try {
            const result = this.commands[canonicalCommand](args);
            return {
                output: result.output || '',
                error: false,
                navigation: result.navigation || null,
                exit: result.exit || false
            };
        } catch (error) {
            return {
                output: `Error: ${error.message}`,
                error: true
            };
        }
    }

    /**
     * Parse command string into command and arguments
     * @private
     */
    _parseCommand(input) {
        const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const command = parts[0] || '';
        const args = parts.slice(1).map(arg => arg.replace(/^"|"$/g, ''));

        return { command, args };
    }

    /**
     * Check if input contains unsupported shell features
     * @private
     */
    _containsShellFeatures(input) {
        const shellFeatures = ['|', '>', '<', '&&', '||', ';', '`', '$'];
        return shellFeatures.some(feature => input.includes(feature));
    }

    /**
     * Command: list - List directory contents
     */
    cmdList(args) {
        const path = args[0] || '.';

        try {
            const entries = this.vfs.listDirectory(path, this.cwd);

            if (entries.length === 0) {
                return { output: '(empty directory)' };
            }

            const lines = entries.map(entry => {
                const suffix = entry.type === 'directory' ? '/' : '';
                return `${entry.name}${suffix}`;
            });

            return { output: lines.join('\n') };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Command: open - Navigate to path or open file
     */
    cmdOpen(args) {
        if (args.length === 0) {
            return { output: `Current directory: ${this.cwd}` };
        }

        const path = args[0];

        try {
            const node = this.vfs.resolvePath(path, this.cwd);

            if (!node) {
                throw new Error(`path not found: ${path}`);
            }

            if (node.type === 'directory') {
                // Change directory
                this.cwd = node.path;
                return { output: `Changed directory to ${this.cwd}` };
            } else {
                // File - check if it's a project file or special file
                const projectId = this.vfs.getProjectIdFromPath(node.path);

                if (projectId) {
                    return {
                        output: `Opening project: ${node.path}`,
                        navigation: {
                            type: 'project',
                            projectId: projectId
                        }
                    };
                } else if (node.url) {
                    return {
                        output: `Opening: ${node.path}`,
                        navigation: {
                            type: 'url',
                            url: node.url
                        }
                    };
                } else {
                    // Just display the file
                    return {
                        output: node.content || '(empty file)'
                    };
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Command: read - Read file contents
     */
    cmdRead(args) {
        if (args.length === 0) {
            throw new Error('read requires a file path');
        }

        const path = args[0];

        try {
            const content = this.vfs.readFile(path, this.cwd);
            return { output: content };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Command: tree - Display tree structure
     */
    cmdTree(args) {
        const path = args[0] || '.';
        const depth = args[1] ? parseInt(args[1], 10) : 3;

        if (isNaN(depth) || depth < 1) {
            throw new Error('tree depth must be a positive number');
        }

        try {
            const tree = this.vfs.getTree(path, depth, this.cwd);
            return { output: tree };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Command: search - Search for keyword
     */
    cmdSearch(args) {
        if (args.length === 0) {
            throw new Error('search requires a keyword');
        }

        const keyword = args.join(' ');

        try {
            const results = this.vfs.search(keyword);

            if (results.length === 0) {
                return { output: `No results found for: ${keyword}` };
            }

            const lines = [`Found ${results.length} result(s) for: ${keyword}\n`];

            results.forEach((result, i) => {
                lines.push(`[${i + 1}] ${result.path}`);
                lines.push(`    ${result.snippet}`);
                if (i < results.length - 1) {
                    lines.push('');
                }
            });

            return { output: lines.join('\n') };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Command: help - Display help information
     */
    cmdHelp(args) {
        const helpText = `Console Mode - Available Commands

NAVIGATION:
  list [path]          List directory contents (alias: ls, dir)
  open <path>          Navigate to directory or open file (alias: cd)
  cwd                  Show current working directory (alias: pwd)

FILE OPERATIONS:
  read <path>          Read file contents (alias: cat)
  tree [path] [depth]  Display tree structure (default depth: 3)

SEARCH:
  search <keyword>     Search for keyword across all content

UTILITY:
  help                 Display this help message
  clear                Clear console output
  exit                 Close console (alias: quit)

PATH NOTATION:
  /                    Root directory
  .                    Current directory
  ..                   Parent directory
  /absolute/path       Absolute path from root
  relative/path        Relative to current directory

FILESYSTEM STRUCTURE:
  /base/               About, contact, resume
  /projects/           Project directories
  /meta/               System information

KEYBOARD SHORTCUTS:
  Ctrl+\`               Toggle console
  Ctrl+L               Clear screen
  Esc                  Close console
  ↑/↓                  Navigate command history
  Tab                  Autocomplete (coming soon)

NOTE: This is a read-only portfolio system. Shell features like pipes,
redirection, and command chaining are not supported.`;

        return { output: helpText };
    }

    /**
     * Command: clear - Clear console
     */
    cmdClear(args) {
        return {
            output: '',
            clear: true
        };
    }

    /**
     * Command: cwd - Show current working directory
     */
    cmdCwd(args) {
        return { output: this.cwd };
    }

    /**
     * Command: exit - Close console
     */
    cmdExit(args) {
        return {
            output: 'Closing console...',
            exit: true
        };
    }

    /**
     * Get command history
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Get current working directory
     */
    getCwd() {
        return this.cwd;
    }

    /**
     * Set current working directory
     * @param {string} path - Absolute path
     */
    setCwd(path) {
        // Verify path exists and is a directory
        const node = this.vfs.resolvePath(path);
        if (node && node.type === 'directory') {
            this.cwd = node.path;
            return true;
        }
        return false;
    }

    /**
     * Get autocomplete suggestions for partial input
     * @param {string} partial - Partial command or path
     * @returns {Array} Array of suggestions
     */
    getAutocompleteSuggestions(partial) {
        if (!partial || partial.trim().length === 0) {
            return [];
        }

        const trimmed = partial.trim();
        const { command, args } = this._parseCommand(trimmed);

        // If no space, suggest commands
        if (args.length === 0 && !trimmed.endsWith(' ')) {
            const allCommands = [...Object.keys(this.commands), ...Object.keys(this.aliases)];
            return allCommands
                .filter(cmd => cmd.startsWith(command))
                .sort();
        }

        // If command is complete, suggest paths
        const canonicalCommand = this.aliases[command] || command;
        if (this.commands[canonicalCommand]) {
            const pathPrefix = args[args.length - 1] || '';
            return this._getPathSuggestions(pathPrefix);
        }

        return [];
    }

    /**
     * Get path suggestions for autocomplete
     * @private
     */
    _getPathSuggestions(prefix) {
        try {
            // Determine the directory to search in
            let searchDir = this.cwd;
            let searchPrefix = prefix;

            if (prefix.includes('/')) {
                const lastSlash = prefix.lastIndexOf('/');
                const dirPart = prefix.substring(0, lastSlash + 1);
                searchPrefix = prefix.substring(lastSlash + 1);

                const dirNode = this.vfs.resolvePath(dirPart, this.cwd);
                if (dirNode && dirNode.type === 'directory') {
                    searchDir = dirNode.path;
                } else {
                    return [];
                }
            }

            const entries = this.vfs.listDirectory(searchDir, this.cwd);
            return entries
                .filter(entry => entry.name.startsWith(searchPrefix))
                .map(entry => {
                    const suffix = entry.type === 'directory' ? '/' : '';
                    return entry.name + suffix;
                })
                .sort();
        } catch (error) {
            return [];
        }
    }
}
