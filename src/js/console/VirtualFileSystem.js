/**
 * VirtualFileSystem - Read-only virtual filesystem for portfolio content
 * 
 * Exposes portfolio data through a filesystem abstraction:
 * /base/ - About, contact, resume
 * /projects/ - Project directories with overview, architecture, decisions, impact
 * /meta/ - System information
 */

import { CONSTANTS } from '../config/constants.js';

export class VirtualFileSystem {
  constructor() {
    this.root = null;
    this.projectData = null;
    this.initialized = false;
  }

  /**
   * Initialize the filesystem with project data
   * @param {Array} projectData - Array of project objects from project-data.json
   */
  async initialize(projectData) {
    if (this.initialized) return;

    this.projectData = projectData;
    this.root = this._buildFileTree();
    this.initialized = true;
  }

  /**
   * Build the complete file tree structure
   * @private
   */
  _buildFileTree() {
    const tree = {
      type: 'directory',
      name: '',
      path: '/',
      children: {
        'base': this._buildBaseDirectory(),
        'projects': this._buildProjectsDirectory(),
        'meta': this._buildMetaDirectory()
      }
    };
    return tree;
  }

  /**
   * Build /base/ directory structure
   * @private
   */
  _buildBaseDirectory() {
    return {
      type: 'directory',
      name: 'base',
      path: '/base',
      children: {
        'about': {
          type: 'file',
          name: 'about',
          path: '/base/about',
          content: this._getAboutContent()
        },
        'contact': {
          type: 'file',
          name: 'contact',
          path: '/base/contact',
          content: this._getContactContent()
        },
        'resume': {
          type: 'file',
          name: 'resume',
          path: '/base/resume',
          content: '[Resume Link - Opens in browser]',
          url: CONSTANTS.RESUME_URL
        }
      }
    };
  }

  /**
   * Build /projects/ directory structure
   * @private
   */
  _buildProjectsDirectory() {
    const projectsDir = {
      type: 'directory',
      name: 'projects',
      path: '/projects',
      children: {}
    };

    if (!this.projectData) return projectsDir;

    this.projectData.forEach(project => {
      const slug = this._generateSlug(project.title);
      const projectNode = {
        type: 'directory',
        name: slug,
        path: `/projects/${slug}`,
        projectId: project.id,
        children: {
          'overview': {
            type: 'file',
            name: 'overview',
            path: `/projects/${slug}/overview`,
            content: this._formatProjectOverview(project)
          },
          'architecture': {
            type: 'file',
            name: 'architecture',
            path: `/projects/${slug}/architecture`,
            content: this._formatProjectArchitecture(project)
          },
          'decisions.log': {
            type: 'file',
            name: 'decisions.log',
            path: `/projects/${slug}/decisions.log`,
            content: this._formatProjectDecisions(project)
          },
          'impact': {
            type: 'file',
            name: 'impact',
            path: `/projects/${slug}/impact`,
            content: this._formatProjectImpact(project)
          }
        }
      };

      // Add attachments directory if valid attachments exist
      if (project.attachments && project.attachments.length > 0) {
        projectNode.children['attachments'] = this._buildAttachmentsDirectory(project, slug);
      }

      projectsDir.children[slug] = projectNode;
    });

    return projectsDir;
  }

  /**
   * Build /meta/ directory structure
   * @private
   */
  _buildMetaDirectory() {
    return {
      type: 'directory',
      name: 'meta',
      path: '/meta',
      children: {
        'system.info': {
          type: 'file',
          name: 'system.info',
          path: '/meta/system.info',
          content: this._getSystemInfo()
        },
        'version': {
          type: 'file',
          name: 'version',
          path: '/meta/version',
          content: 'Portfolio v2.0\nLast Updated: January 2026'
        }
      }
    };
  }

  /**
   * Resolve a path to a file or directory node
   * @param {string} path - Absolute or relative path
   * @param {string} cwd - Current working directory
   * @returns {Object|null} File/directory node or null if not found
   */
  resolvePath(path, cwd = '/') {
    if (!this.initialized) {
      throw new Error('Filesystem not initialized');
    }

    const absolutePath = this._resolveAbsolutePath(path, cwd);
    const parts = absolutePath.split('/').filter(p => p.length > 0);

    if (parts.length === 0) {
      return this.root;
    }

    let current = this.root;
    for (const part of parts) {
      if (current.type !== 'directory' || !current.children) {
        return null;
      }
      current = current.children[part];
      if (!current) {
        return null;
      }
    }

    return current;
  }

  /**
   * List contents of a directory
   * @param {string} path - Directory path
   * @param {string} cwd - Current working directory
   * @returns {Array} Array of directory entries
   */
  listDirectory(path, cwd = '/') {
    const node = this.resolvePath(path, cwd);

    if (!node) {
      throw new Error(`path not found: ${path}`);
    }

    if (node.type !== 'directory') {
      throw new Error(`not a directory: ${path}`);
    }

    const entries = [];
    for (const [name, child] of Object.entries(node.children || {})) {
      entries.push({
        name: name,
        type: child.type,
        path: child.path
      });
    }

    return entries.sort((a, b) => {
      // Directories first, then alphabetically
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Read file contents
   * @param {string} path - File path
   * @param {string} cwd - Current working directory
   * @returns {string} File contents
   */
  readFile(path, cwd = '/') {
    const node = this.resolvePath(path, cwd);

    if (!node) {
      throw new Error(`path not found: ${path}`);
    }

    if (node.type !== 'file') {
      throw new Error(`not a file: ${path}`);
    }

    return node.content || '';
  }

  /**
   * Generate tree view of directory structure
   * @param {string} path - Root path for tree
   * @param {number} depth - Maximum depth to traverse
   * @param {string} cwd - Current working directory
   * @returns {string} Tree representation
   */
  getTree(path = '/', depth = 3, cwd = '/') {
    const node = this.resolvePath(path, cwd);

    if (!node) {
      throw new Error(`path not found: ${path}`);
    }

    const lines = [];
    this._buildTreeLines(node, '', true, depth, 0, lines);
    return lines.join('\n');
  }

  /**
   * Build tree lines recursively
   * @private
   */
  _buildTreeLines(node, prefix, isLast, maxDepth, currentDepth, lines) {
    if (currentDepth > maxDepth) return;

    const connector = isLast ? '└── ' : '├── ';
    const displayName = node.name || '/';
    const suffix = node.type === 'directory' ? '/' : '';

    if (currentDepth > 0) {
      lines.push(prefix + connector + displayName + suffix);
    } else {
      lines.push(displayName + suffix);
    }

    if (node.type === 'directory' && node.children && currentDepth < maxDepth) {
      const childEntries = Object.entries(node.children);
      childEntries.forEach(([name, child], index) => {
        const isLastChild = index === childEntries.length - 1;
        const newPrefix = currentDepth === 0 ? '' : prefix + (isLast ? '    ' : '│   ');
        this._buildTreeLines(child, newPrefix, isLastChild, maxDepth, currentDepth + 1, lines);
      });
    }
  }

  /**
   * Search for keyword across all content
   * @param {string} keyword - Search term
   * @returns {Array} Array of search results
   */
  search(keyword) {
    if (!keyword || keyword.trim().length === 0) {
      throw new Error('search keyword required');
    }

    const results = [];
    const searchTerm = keyword.toLowerCase();

    this._searchNode(this.root, searchTerm, results);

    return results;
  }

  /**
   * Search node recursively
   * @private
   */
  _searchNode(node, searchTerm, results) {
    if (node.type === 'file' && node.content) {
      const content = node.content.toLowerCase();
      if (content.includes(searchTerm)) {
        // Find context around the match
        const index = content.indexOf(searchTerm);
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + searchTerm.length + 50);
        const snippet = node.content.substring(start, end);

        results.push({
          path: node.path,
          type: 'file',
          snippet: (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '')
        });
      }
    }

    if (node.type === 'directory' && node.children) {
      for (const child of Object.values(node.children)) {
        this._searchNode(child, searchTerm, results);
      }
    }
  }

  /**
   * Resolve absolute path from relative path
   * @private
   */
  _resolveAbsolutePath(path, cwd) {
    if (path.startsWith('/')) {
      return this._normalizePath(path);
    }

    // Handle relative paths
    const cwdParts = cwd.split('/').filter(p => p.length > 0);
    const pathParts = path.split('/').filter(p => p.length > 0);

    for (const part of pathParts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        cwdParts.pop();
      } else {
        cwdParts.push(part);
      }
    }

    return '/' + cwdParts.join('/');
  }

  /**
   * Normalize path by removing redundant slashes
   * @private
   */
  _normalizePath(path) {
    const parts = path.split('/').filter(p => p.length > 0);
    return '/' + parts.join('/');
  }

  /**
   * Generate URL-friendly slug from project title
   * @private
   */
  _generateSlug(title) {
    return title
      .toLowerCase()
      .split('—')[0]
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get about content
   * @private
   */
  _getAboutContent() {
    return `RAHEEMUDHEEN MA
Full-Stack Engineer

I build production systems with a focus on architectural clarity, maintainability, and long-term scalability. My work spans full-stack development, frontend architecture, real-time systems, and product ownership across fintech, logistics, and SaaS domains.

I care about systems thinking, product judgment, and delivering work that lasts.`;
  }

  /**
   * Get contact content
   * @private
   */
  _getContactContent() {
    return `Contact Information:

Email: ${CONSTANTS.EMAIL}
GitHub: ${CONSTANTS.GITHUB_URL}
LinkedIn: ${CONSTANTS.LINKEDIN_URL}
Location: Kerala, India`;
  }

  /**
   * Get system information
   * @private
   */
  _getSystemInfo() {
    return `Portfolio System Information

Technology Stack:
- Vanilla JavaScript (ES6+)
- Vite (Build Tool)
- GSAP (Animations)
- LoconativeScroll (Smooth Scrolling)
- SCSS (Styling)

Architecture:
- Two-page application (index.html, project.html)
- URL-based routing with query parameters
- Centralized data model (project-data.json)
- Direct DOM manipulation
- Theme preference in localStorage

Console Mode:
- Read-only virtual filesystem
- Lazy-loaded module
- Zero impact on initial page load`;
  }

  /**
   * Format project overview
   * @private
   */
  _formatProjectOverview(project) {
    let content = `${project.title}\n`;
    content += `${'='.repeat(project.title.length)}\n\n`;
    content += `Role: ${project.role}\n\n`;
    content += `${project.description}\n\n`;

    if (project.problem_statement) {
      content += `Problem Statement:\n${project.problem_statement}\n`;
    }

    return content;
  }

  /**
   * Format project architecture
   * @private
   */
  _formatProjectArchitecture(project) {
    let content = `Architecture - ${project.title}\n`;
    content += `${'='.repeat(project.title.length + 15)}\n\n`;

    if (project.architecture_image) {
      content += `Architecture Diagram: /public/${project.architecture_image}\n\n`;
    }

    if (project.technical_highlights) {
      content += `Technical Highlights:\n`;
      project.technical_highlights.forEach((highlight, i) => {
        content += `${i + 1}. ${highlight}\n`;
      });
    }

    return content;
  }

  /**
   * Format project design decisions
   * @private
   */
  _formatProjectDecisions(project) {
    let content = `Design Decisions - ${project.title}\n`;
    content += `${'='.repeat(project.title.length + 18)}\n\n`;

    if (project.design_decisions) {
      project.design_decisions.forEach((decision, i) => {
        content += `[${i + 1}] ${decision}\n\n`;
      });
    }

    return content;
  }

  /**
   * Format project impact metrics
   * @private
   */
  _formatProjectImpact(project) {
    let content = `Impact Metrics - ${project.title}\n`;
    content += `${'='.repeat(project.title.length + 17)}\n\n`;

    if (project.impact_metrics) {
      project.impact_metrics.forEach((metric, i) => {
        content += `• ${metric}\n`;
      });
    }

    return content;
  }

  /**
   * Build attachments directory for a project
   * @private
   */
  _buildAttachmentsDirectory(project, slug) {
    const attachmentsDir = {
      type: 'directory',
      name: 'attachments',
      path: `/projects/${slug}/attachments`,
      children: {}
    };

    project.attachments.forEach((att, index) => {
      // Determine extension/filename
      const isPdf = att.url.toLowerCase().endsWith('.pdf');
      const ext = isPdf ? 'pdf' : 'jpg'; // Default to jpg for images if unknown

      // Create a friendly filename from caption
      let filename = this._generateSlug(att.caption || `attachment-${index + 1}`);
      filename = `${filename}.${ext}`;

      // Ensure uniqueness
      let counter = 1;
      let originalFilename = filename;
      while (attachmentsDir.children[filename]) {
        filename = `${originalFilename.replace(`.${ext}`, '')}-${counter}.${ext}`;
        counter++;
      }

      attachmentsDir.children[filename] = {
        type: 'file',
        name: filename,
        path: `/projects/${slug}/attachments/${filename}`,
        content: `Attachment: ${att.caption}\nType: ${isPdf ? 'PDF Document' : 'Image'}\nURL: ${att.url}\n\nUse 'open' command to view.`,
        url: att.url
      };
    });

    return attachmentsDir;
  }

  /**
   * Get project ID from path
   * @param {string} path - Project path
   * @returns {number|null} Project ID or null
   */
  getProjectIdFromPath(path) {
    const node = this.resolvePath(path);
    if (!node) return null;

    // If it's a project directory, return its projectId
    if (node.projectId) {
      return node.projectId;
    }

    // If it's a file in a project directory, find parent
    const parts = path.split('/').filter(p => p.length > 0);
    if (parts.length >= 2 && parts[0] === 'projects') {
      const projectSlug = parts[1];
      const projectNode = this.resolvePath(`/projects/${projectSlug}`);
      return projectNode?.projectId || null;
    }

    return null;
  }

  /**
   * Get project path from ID
   * @param {number} id - Project ID
   * @returns {string|null} Project path or null
   */
  getProjectPathById(id) {
    if (!this.root || !this.root.children.projects) return null;

    const projectId = parseInt(id, 10);
    const projects = this.root.children.projects.children;

    for (const project of Object.values(projects)) {
      if (project.projectId === projectId) {
        return project.path;
      }
    }

    return null;
  }
}
