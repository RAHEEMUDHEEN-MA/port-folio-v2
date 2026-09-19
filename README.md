# Raheemudheen — Portfolio

Personal portfolio website of **Raheemudheen M A**, a Product Engineer focused on building production-ready web systems, reusable frontend platforms, business applications, and AI-enabled product experiences.

Live site: https://raheemudheen.com

---

## Overview

This portfolio is built as a Vite-based web application with a configuration-driven content architecture.

Rather than hardcoding portfolio content directly into UI components, profile and project information is maintained in structured data files and transformed into static HTML during the build process.

The site combines:

- Static HTML for SEO and crawler accessibility
- JavaScript for interactive behaviour and animations
- Configuration-driven project content
- Build-time generation of project detail pages
- Automated sitemap generation
- Responsive UI and theme support
- GitHub Actions-based deployment to a VPS

---

## Tech Stack

### Frontend

- HTML5
- SCSS / CSS Custom Properties
- Vanilla JavaScript
- Vite
- GSAP (Complex Animations)
- Lenis (Smooth Scrolling)

### Build & Content Generation

- Node.js
- Cheerio
- Vite build pipeline
- JSON-based content configuration
- Custom static page generators (`scripts/predev.js`)

### Deployment

- GitHub
- GitHub Actions
- SSH
- VPS
- Nginx
- PM2

---

## Local Development

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed. This project uses `npm` as its package manager.

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

*Note: Running `npm run dev` automatically triggers the pre-build script, which compiles the JSON data into static HTML before starting Vite.*

### Production Build

```bash
# Generate the optimized static site in the /dist folder
npm run build

# Preview the built site locally
npm run preview
```

---

## Architecture

The portfolio uses a configuration-driven architecture.

### Profile Content

General profile information is maintained separately from the HTML presentation.

```text
profile-data.json
       │
       ▼
build-profile.js
       │
       ▼
src/index.html
       │
       ▼
Vite
       │
       ▼
dist/index.html
```