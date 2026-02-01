import LoconativeScroll from "loconative-scroll";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

class ProjectPage {
  constructor() {
    this.initScroll();
    this.loadProject();
    this.themeActions();
    this.initConsole();
  }

  initScroll() {
    this.scroll = new LoconativeScroll({
      el: document.querySelector("[data-scroll-container]"),
      smooth: true,
      lerp: 0.06,
      tablet: {
        breakpoint: 768,
      },
    });

    // Update ScrollTrigger on scroll
    this.scroll.on("scroll", ScrollTrigger.update);
    ScrollTrigger.scrollerProxy("[data-scroll-container]", {
      scrollTop(value) {
        return arguments.length ? this.scroll.scrollTo(value, 0, 0) : this.scroll.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      }
    });

    // Refresh after standard updates
    setTimeout(() => this.scroll.update(), 500);
  }

  async loadProject() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");
    const container = document.getElementById("js-project-content");

    if (!projectId) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch("/project-data.json");
      const data = await response.json();
      const project = data.find(p => String(p.id) === String(projectId));

      if (!project) {
        container.innerHTML = "<h1>Project not found</h1> <a href='/'>Go Home</a>";
        return;
      }

      this.renderProject(project, container);

      // Update scroll after content injection
      setTimeout(() => {
        this.scroll.update();
        ScrollTrigger.refresh();
      }, 100);

    } catch (e) {
      console.error(e);
      container.innerHTML = "<h1>Error loading project</h1>";
    }
  }

  themeActions() {
    const themeToggle = document.getElementById("js-theme-toggle");
    // Initialize theme from localStorage
    // Initialize theme from localStorage
    const storedTheme = localStorage.getItem("theme");
    if (!storedTheme || storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (!storedTheme) localStorage.setItem("theme", "dark");
    }

    // Since we don't have the toggle button in the simple nav yet, 
    // we just ensure the theme is applied. 
    // If you add a toggle in project.html, use the same logic as index.js
  }

  async initConsole() {
    let consoleLoaded = false;
    let consoleInstance = null;
    let projectData = null;

    const toggleConsole = async (isChecked) => {
      if (!consoleLoaded) {
        try {
          const { getConsoleInstance } = await import('./console/ConsoleMode.js');
          if (!projectData) {
            const response = await fetch('/project-data.json');
            projectData = await response.json();
          }
          consoleInstance = await getConsoleInstance(projectData);
          consoleLoaded = true;
        } catch (error) {
          console.error('Failed to load console:', error);
          return;
        }
      }

      if (isChecked) {
        // Sync CWD with current project if needed
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (projectId && consoleInstance.vfs) {
          const projectPath = consoleInstance.vfs.getProjectPathById(projectId);
          if (projectPath) {
            consoleInstance.setCwd(projectPath);
          }
        }

        consoleInstance.show();
      } else {
        consoleInstance.hide();
      }
    };

    // Setup keyboard shortcut
    document.addEventListener('keydown', async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        const checkbox = document.getElementById('js-console-toggle');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          await toggleConsole(checkbox.checked);
        }
      }
    });

    // Setup toggle switch
    const toggleSwitch = document.getElementById('js-console-toggle');
    if (toggleSwitch) {
      toggleSwitch.addEventListener('change', async (e) => {
        await toggleConsole(e.target.checked);
      });
    }
  }

  renderProject(project, container) {
    const designDecisions = project.design_decisions ? project.design_decisions.map(d => `<li>${d}</li>`).join('') : '';
    const technicalHighlights = project.technical_highlights ? project.technical_highlights.map(h => `<li>${h}</li>`).join('') : '';
    const impactMetrics = project.impact_metrics ? project.impact_metrics.map(m => `<li>${m}</li>`).join('') : '';
    const links = project.links ? project.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`).join(' / ') : '';

    const html = `
      <div class="project-header" data-scroll-section>
        <h1 class="project-title" data-scroll data-scroll-speed="2" data-scroll-position="top" data-scroll-direction="vertical">${project.title}</h1>
        <p class="project-role" data-scroll data-scroll-speed="1" data-scroll-position="top" data-scroll-direction="vertical">${project.role}</p>
      </div>

      <div class="project-body" data-scroll-section>
         <div class="section context" data-scroll data-scroll-speed="2" data-scroll-direction="horizontal">
           <h3>Context</h3>
           <p>${project.problem_statement || project.description}</p>
         </div>

         ${project.architecture_image ? `
         <div class="section architecture" data-scroll data-scroll-speed="-2" data-scroll-direction="horizontal">
           <h3>Architecture Overview</h3>
           <div class="architecture-diagram">
              <img src="${project.architecture_image}" alt="Architecture Diagram for ${project.title}" class="architecture-img" style="max-width: 100%; height: auto;" onerror="this.closest('.section.architecture').style.display='none'" />
           </div>
         </div>
         ` : ''}

         ${technicalHighlights ? `
         <div class="section technical-highlights" data-scroll data-scroll-speed="2" data-scroll-direction="horizontal">
           <h3>Technical Highlights</h3>
           <ul class="styled-list">
             ${technicalHighlights}
           </ul>
         </div>
         ` : ''}

         ${designDecisions ? `
         <div class="section decisions" data-scroll data-scroll-speed="2" data-scroll-direction="horizontal">
           <h3>System Flow / Design Decisions</h3>
           <ul class="styled-list">
             ${designDecisions}
           </ul>
         </div>
         ` : ''}

         ${impactMetrics ? `
         <div class="section impact" data-scroll data-scroll-speed="-2" data-scroll-direction="horizontal">
           <h3>Impact & Outcomes</h3>
           <ul class="styled-list">
             ${impactMetrics}
           </ul>
         </div>
         ` : ''}

         ${links ? `
         <div class="section pro-links" data-scroll data-scroll-speed="1" data-scroll-direction="horizontal">
           ${links}
         </div>
         ` : ''}
         
         ${this.renderAttachments(project)}
      </div>
      ${this.renderModal()}
    `;

    container.innerHTML = html;
    this.initModalListeners();

    // Refresh for locomotive
    setTimeout(() => {
      this.scroll.update();
      ScrollTrigger.refresh();
    }, 100);
  }

  renderAttachments(project) {
    if (!project.attachments || project.attachments.length === 0) return '';

    const items = project.attachments.map((att, index) => {
      const isPdf = att.url.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        return `
          <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="attachment-item pdf-item" aria-label="Open PDF: ${att.caption}">
            <span class="pdf-icon">PDF</span>
            <span class="pdf-caption">${att.caption}</span>
          </a>
        `;
      }

      return `
        <button class="attachment-item image-item" data-index="${index}" aria-label="View screenshot: ${att.caption}">
          <img class="attachment-thumb" src="${att.url}" alt="${att.alt}" loading="lazy" />
        </button>
      `;
    }).join('');

    return `
      <div class="section attachments-grid-container" data-scroll data-scroll-speed="0.5">
         <h3>Interface Snapshots & Docs</h3>
         <div class="attachments-grid">
           ${items}
         </div>
         <p class="attachments-disclaimer">Screens shown are representative and anonymized.</p>
      </div>
    `;
  }

  renderModal() {
    return `
      <div class="attachment-modal" id="js-attachment-modal" aria-hidden="true">
        <div class="modal-backdrop" id="js-modal-close"></div>
        <div class="modal-content">
          <button class="modal-close-btn" id="js-modal-close-btn" aria-label="Close modal">×</button>
          <figure class="modal-figure">
             <img id="js-modal-image" src="" alt="" />
             <figcaption id="js-modal-caption"></figcaption>
          </figure>
        </div>
      </div>
    `;
  }

  initModalListeners() {
    const modal = document.getElementById("js-attachment-modal");
    if (!modal) return;

    const modalImg = document.getElementById("js-modal-image");
    const modalCaption = document.getElementById("js-modal-caption");
    const triggers = document.querySelectorAll(".attachment-item.image-item");
    const closeBtns = [
      document.getElementById("js-modal-close"),
      document.getElementById("js-modal-close-btn")
    ];

    triggers.forEach(trigger => {
      trigger.addEventListener("click", () => {
        const img = trigger.querySelector("img");
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        modalCaption.textContent = trigger.getAttribute("aria-label").replace("View screenshot: ", "");
        modal.classList.add("is-active");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden"; // Prevent background scroll
        this.scroll.stop(); // Stop locomotive scroll
      });
    });

    const closeModal = () => {
      modal.classList.remove("is-active");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      this.scroll.start(); // Resume locomotive scroll
      setTimeout(() => {
        modalImg.src = ""; // Clear for next time
      }, 300);
    };

    closeBtns.forEach(btn => btn?.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-active")) {
        closeModal();
      }
    });
  }
}

new ProjectPage();
