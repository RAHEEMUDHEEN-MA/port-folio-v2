import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { copyText } from "./utils/index";
import { mapEach } from "./utils/dom";
import { initGA, trackEvent } from "./utils/analytics";
const toContactButtons = document.querySelectorAll(".contact-scroll");
const footer = document.getElementById("js-footer");
const scrollEl = document.querySelector("[data-scroll-container]");
const emailButton = document.querySelector("button.email");
const themeToggle = document.getElementById("js-theme-toggle");
const toCopyText = document.querySelector(".to-copy span");


gsap.registerPlugin(ScrollTrigger);

// Ultimate Safari Swipe-Back Hack
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    // Force a complete synchronous reflow of the body to unfreeze the iOS compositor
    setTimeout(() => {
      document.body.style.display = "none";
      document.body.offsetHeight; // force reflow
      document.body.style.display = "";
      
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, 0);
  }
});

const scroll = new Lenis({
  lerp: 0.06,
  smoothWheel: true,
});

gsap.ticker.add((time) => {
  scroll.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

scroll.on("scroll", ScrollTrigger.update);

export default class Home {
  constructor(scroll) {
    this.locomotive = scroll;
    this.init().catch(err => console.error("Initialization failed:", err));
  }

  async init() {
    this.heroTextAnimation();
    this.homeIntro();

    await this.initProfile();
    await this.initProjects();
    this.homeAnimations(); // Must run after projects are injected
    this.initParallax();

    this.homeActions();
    this.themeActions();
    this.initConsole();
    this.updateLinks();

    // Initialize Analytics
    initGA(import.meta.env.VITE_GA_MEASUREMENT_ID);
    this.initAnalyticsEvents();
  }

  async initProfile() {
    try {
      // Check if static content was injected at build time
      const techApproachContainer = document.querySelector('.home__content');
      const hasStaticContent = techApproachContainer && techApproachContainer.querySelector('.home__content__title');

      if (hasStaticContent) {
        // Re-initialize contact buttons inside static content
        const newContactButtons = document.querySelectorAll(".contact-scroll");
        mapEach(newContactButtons, (button) => {
          button.onclick = () => {
            this.locomotive.scrollTo(footer);
          };
        });
        return;
      }

      const response = await fetch('/profile-data.json');
      const data = await response.json();

      // 1. About
      const aboutContainer = document.querySelector('.hero__paragraph');
      if (aboutContainer && data.about) {
        aboutContainer.innerHTML = data.about.description;
      }

      // 2. Technical Approach
      if (techApproachContainer && data.technical_approach) {
        techApproachContainer.innerHTML = `
          <h2 class="home__content__title">${data.technical_approach.title}</h2>
          <p class="home__content__desc">${data.technical_approach.description}</p>
        `;
      }

      // 3. Technical Stack
      const techStackContainer = document.querySelector('.home__awards__table');
      if (techStackContainer && data.technical_stack && data.technical_stack.items) {
        const itemsHTML = data.technical_stack.items.map(item => `
            <div class="awards__item" data-fade-in="">${item}</div>
         `).join('');
        techStackContainer.innerHTML = itemsHTML;
      }

      // 4. Education
      const eduContainer = document.querySelector('.home__awards__stack');
      if (eduContainer && data.education) {
        const eduItems = data.education.items.map(item => `${item} <br>`).join(' ');
        const githubLink = data.education.github ? `<a href="${data.education.github.url}" target="_blank" rel="noopener noreferrer">${data.education.github.label}</a>` : '';

        eduContainer.innerHTML = `
          <h2 class="home__content__title">${data.education.title}</h2>
          <p class="home__content__desc">
            ${eduItems}
            ${githubLink}
          </p>
        `;
      }

      // 5. Professional Focus
      const focusContainer = document.querySelector('.home__awards__ice');
      if (focusContainer && data.professional_focus) {
        focusContainer.innerHTML = `
          <h2 class="home__content__title">${data.professional_focus.title}</h2>
          <p class="home__content__desc">${data.professional_focus.description}</p>
        `;
      }

      // Re-initialize contact buttons inside dynamic content
      const newContactButtons = document.querySelectorAll(".contact-scroll");
      mapEach(newContactButtons, (button) => {
        button.onclick = () => {
          this.locomotive.scrollTo(footer);
        };
      });

    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  }

  async initProjects() {
    try {
      const response = await fetch('/project-data.json');
      const projects = await response.json();

      const section1Container = document.querySelector('[data-projects-section-1]');
      const section2Container = document.querySelector('[data-projects-section-2]');

      if (!section1Container || !section2Container) return;

      // Split projects: First 4 go to section 1, rest to section 2.
      // Note: original had 4 in top section (idx 0,1,2,3) and 3 in bottom (idx 4,5,6)
      const section1Projects = projects.slice(0, 4);
      const section2Projects = projects.slice(4);

      const generateProjectHTML = (project, index, isFirstSection = true) => {
        // Alternating logic:
        // Index 0 (Even) -> Right Project (Line Left)
        // Index 1 (Odd) -> Left Project (Line Right)
        // Index 2 (Even) -> Right Project ...
        // Note: For section 2, the index should continue strictly? 
        // Original HTML:
        // Sec 1 Item 0 (ID 1): Right Project
        // Sec 1 Item 1 (ID 2): Left Project
        // Sec 1 Item 2 (ID 3): Right Project
        // Sec 1 Item 3 (ID 4): Left Project
        // -- Section Break --
        // Sec 2 Item 0 (ID 5): Right Project
        // Sec 2 Item 1 (ID 6): Left Project
        // Sec 2 Item 2 (ID 7): Right Project

        // So we can just use the index within the loop if we want to reset strict alternation per section
        // OR preserve global alternation.
        // Looking at original innerHTML, sec 2 started with "Right Project".
        // So both sections start with a "Right Project".
        // Thus, we use local index for alternation.

        const isEven = index % 2 === 0;
        const lineClass = isEven ? 'left' : 'right';
        const projectClass = isEven ? 'right' : 'left';
        const titleScrollSpeed = isEven ? '2' : '-2';
        const titleAlign = isEven ? 'right' : 'left';

        // Special label logic for the very first project
        let labelHTML = '';
        if (isFirstSection && index === 0) {
          // Featured label
          labelHTML = `
            <div class="label__inner label-1">
               <p>FEATURED <br> PROJECTS (${projects.length})</p>
               <p>${project.role}</p>
             </div>`;
        } else {
          labelHTML = `
            <div class="label__inner">
               <p>${project.role}</p>
             </div>`;
        }

        const truncateText = (text, maxLength) => {
          if (!text) return "";
          if (text.length <= maxLength) return text;
          return text.substring(0, maxLength).trim() + "...";
        };

        const rightArrowIcon = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        return `
          <span class="home__projects__line ${lineClass}"><span></span></span>
          <div class="home__projects__project ${projectClass}">
            <div class="home__projects__project__label">
              ${labelHTML}
            </div>
            
            <a class="home__projects__project__link">
              <h1 class="home__projects__project__title">
                <span class="inline-ovh">
                  <div class="title__main ${titleAlign}">
                    <span class="slide-up" data-content="${project.title}" aria-hidden="true"></span>
                    ${project.title}
                  </div>
                </span>
              </h1>
            </a>
            
            <div class="project__info">
              <p class="project__description-snippet">${truncateText(project.description, 120)}</p>
              <a href="/project.html?id=${project.id}" class="read-more-link">
                READ MORE 
                <span class="arrow">${rightArrowIcon}</span>
              </a>
            </div>
          </div>
        `;
      };

      section1Container.innerHTML = section1Projects.map((p, i) => generateProjectHTML(p, i, true)).join('');
      section2Container.innerHTML = section2Projects.map((p, i) => generateProjectHTML(p, i, false)).join('');

      // Also refresh ScrollTrigger
      ScrollTrigger.refresh();

    } catch (error) {
      console.error("Failed to load project data:", error);
      // Fallback or empty state could go here
    }
  }



  themeActions() {
    // Initialize theme from localStorage
    const storedTheme = localStorage.getItem("theme");
    if (!storedTheme || storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      if (!storedTheme) localStorage.setItem("theme", "dark");
    }

    if (themeToggle) {
      themeToggle.onclick = () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        if (currentTheme === "dark") {
          document.documentElement.removeAttribute("data-theme");
          localStorage.setItem("theme", "light");
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
          localStorage.setItem("theme", "dark");
        }
      };
    }
  }

  homeActions() {
    mapEach(toContactButtons, (button) => {
      button.onclick = () => {
        this.locomotive.scrollTo(footer);
      };
    });

    emailButton.addEventListener("click", (e) => {
      copyText(e);
      toCopyText.textContent = "copied";

      setTimeout(() => {
        toCopyText.textContent = "Click To Copy";
      }, 2000);
    });
  }

  homeIntro() {
    const tl = gsap.timeline();

    gsap.to(scrollEl, {
      autoAlpha: 1,
    });

    tl.from(".home__nav", {
      duration: 0.5,
      delay: 0.3,
      opacity: 0,
      yPercent: -100,
      ease: "power4.out",
    })
      .from(".hero__title [title-overflow]", {
        duration: 0.7,
        yPercent: 100,
        stagger: {
          amount: 0.2,
        },
        ease: "power4.out",
      })
      .from(
        ".hero__title .bottom__right",
        {
          duration: 1,
          yPercent: 100,
          opacity: 0,
          ease: "power4.out",
        },
        "<20%"
      )
      .set(".hero__title .overflow", { overflow: "unset" })
      .from(
        ".hero__title .mobile",
        {
          duration: 0.7,
          yPercent: 100,
          stagger: {
            amount: 0.2,
          },
          ease: "power4.out",
        },
        "-=1.4"
      );
  }

  homeAnimations() {
    gsap.to(".home__projects__line", { autoAlpha: 1 });
    gsap.utils.toArray(".home__projects__line").forEach((el) => {
      const line = el.querySelector("span");
      gsap.from(line, {
        duration: 1.5,
        scrollTrigger: {
          trigger: el,
        },
        scaleX: 0,
      });
    });

    gsap.utils.toArray("[data-fade-in]").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
        },
        duration: 1.5,
        yPercent: 100,
        opacity: 0,
        ease: "power4.out",
      });
    });

    gsap.utils.toArray(".home__projects__project").forEach((el) => {
      const line = el.previousElementSibling; // The home__projects__line
      const label = el.querySelector(".home__projects__project__label");
      const text = el.querySelector(".title__main");
      const info = el.querySelector(".project__info");
      
      gsap.from([line, label, text, info], {
        scrollTrigger: {
          trigger: el,
          start: "top 85%", // Trigger when project enters viewport
          toggleActions: "play none none reverse",
        },
        duration: 1.5,
        yPercent: 100,
        opacity: 0,
        stagger: {
          amount: 0.3,
        },
        ease: "power4.out",
      });
    });

    if (window.innerWidth <= 768) {
      const awardsTl = gsap.timeline({
        defaults: {
          ease: "power1.out",
        },
        scrollTrigger: {
          trigger: ".home__awards",
        },
      });
      awardsTl.from(".awards__title span", {
        duration: 1,
        opacity: 0,
        yPercent: 100,
        stagger: {
          amount: 0.2,
        },
      });
    }
  }

  async initConsole() {
    let consoleLoaded = false;
    let consoleInstance = null;

    // Show toast notification on first load
    this.showConsoleToast();

    const toggleConsole = async (isChecked) => {
      if (!consoleLoaded) {
        try {
          const { getConsoleInstance } = await import('./console/ConsoleMode.js');
          const response = await fetch('/project-data.json');
          const projectData = await response.json();
          consoleInstance = await getConsoleInstance(projectData);
          consoleLoaded = true;
        } catch (error) {
          console.error('Failed to load console:', error);
          return;
        }
      }

      if (isChecked) {
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

  showConsoleToast() {
    // Check if toast was already shown in this session
    const toastShown = sessionStorage.getItem('consoleToastShown');
    if (toastShown) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'console-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">Console Mode Available</div>
        <div class="toast-message">
          Press <span class="toast-shortcut">Ctrl+\`</span> or use the toggle switch to access the command-line interface
        </div>
      </div>
    `;
    document.body.appendChild(toast);

    // Show toast after a short delay
    setTimeout(() => {
      toast.classList.add('show');
    }, 1000);

    // Hide toast after 6 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');

      // Remove from DOM after animation
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3500);

    // Mark as shown in session
    sessionStorage.setItem('consoleToastShown', 'true');
  }

  updateLinks() {
    import('./config/constants.js').then(({ CONSTANTS }) => {
      const resumeLink = document.getElementById('js-resume-link');
      if (resumeLink) {
        resumeLink.href = CONSTANTS.RESUME_URL;
      }
    }).catch(err => console.error('Failed to load constants', err));
  }

  initAnalyticsEvents() {
    // 1. Resume Download
    const resumeLink = document.getElementById('js-resume-link');
    if (resumeLink) {
      resumeLink.addEventListener('click', () => {
        trackEvent('resume_download');
      });
    }

    // 2. Social Media Clicks (GitHub & LinkedIn)
    const linkedinLinks = document.querySelectorAll('a[href*="linkedin.com"]');
    linkedinLinks.forEach(link => {
      link.addEventListener('click', () => {
        trackEvent('linkedin_click');
      });
    });

    const githubLinks = document.querySelectorAll('a[href*="github.com"]');
    githubLinks.forEach(link => {
      link.addEventListener('click', () => {
        trackEvent('github_click');
      });
    });

    // 3. Engaged Session (> 60 seconds)
    setTimeout(() => {
      trackEvent('engaged_session');
    }, 60000);

    // 4. Scroll Depth (> 70%)
    let scrollTracked = false;
    this.locomotive.on("scroll", (lenis) => {
      if (scrollTracked) return;

      if (lenis.limit > 0) {
        const percentage = lenis.scroll / lenis.limit;
        if (percentage > 0.7) {
          trackEvent('scroll_depth', { depth: '70%' });
          scrollTracked = true;
        }
      }
    });
  }

  heroTextAnimation() {
    gsap.to(".hero__title__dash.desktop", {
      scrollTrigger: {
        trigger: ".hero__title",
        scrub: true,
        start: "-8% 9%",
        end: "110% 20%",
      },
      scaleX: 4,
      ease: "none",
    });
  }

  initParallax() {
    const elements = document.querySelectorAll('[data-scroll-speed]');
    elements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-scroll-speed'));
      if (isNaN(speed) || speed === 0) return;
      
      const direction = el.getAttribute('data-scroll-direction') || 'vertical';
      const position = el.getAttribute('data-scroll-position');
      
      const distance = speed * 50; 
      
      const movement = direction === 'horizontal' ? { x: distance } : { y: distance };
      
      gsap.to(el, {
        ...movement,
        ease: 'none',
        scrollTrigger: {
          trigger: position === 'top' ? document.body : el,
          start: position === 'top' ? 'top top' : 'top bottom',
          end: position === 'top' ? 'bottom top' : 'bottom top',
          scrub: true,
        }
      });
    });
  }
}

new Home(scroll);
