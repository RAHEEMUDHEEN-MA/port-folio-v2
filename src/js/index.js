import LoconativeScroll from "loconative-scroll";
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

const scroll = new LoconativeScroll({
  el: scrollEl,
  smooth: true,
  lerp: 0.06,
  tablet: {
    breakpoint: 768,
  },
});

setTimeout(() => {
  scroll.update();
}, 1000);

scroll.on("scroll", ScrollTrigger.update);

ScrollTrigger.scrollerProxy(scroll.el, {
  scrollTop(value) {
    return arguments.length
      ? scroll.scrollTo(value, 0, 0)
      : scroll.scroll.instance.scroll.y;
  },

  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
});

export default class Home {
  constructor(scroll) {
    this.locomotive = scroll;
    this.heroTextAnimation();
    this.homeIntro();
    this.homeAnimations();
    this.homeActions();
    this.themeActions();
    this.initConsole();
    this.updateLinks();

    // Initialize Analytics
    initGA(import.meta.env.VITE_GA_MEASUREMENT_ID);
    this.initAnalyticsEvents();
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
          scroller: "[data-scroll-container]",
        },
        scaleX: 0,
      });
    });

    gsap.utils.toArray("[data-fade-in]").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          scroller: "[data-scroll-container]",
        },
        duration: 1.5,
        yPercent: 100,
        opacity: 0,
        ease: "power4.out",
      });
    });

    if (window.innerWidth <= 768) {
      gsap.utils.toArray(".home__projects__project").forEach((el) => {
        const text = el.querySelector(".title__main");
        const link = el.querySelector(".project__link");
        gsap.from([text, link], {
          scrollTrigger: {
            trigger: el,
            scroller: "[data-scroll-container]",
          },
          duration: 1.5,
          yPercent: 100,
          stagger: {
            amount: 0.2,
          },
          ease: "power4.out",
        });
      });

      const awardsTl = gsap.timeline({
        defaults: {
          ease: "power1.out",
        },
        scrollTrigger: {
          trigger: ".home__awards",
          scroller: "[data-scroll-container]",
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
    this.locomotive.on("scroll", (args) => {
      if (scrollTracked) return;

      const { scroll, limit } = args;
      if (limit.y > 0) {
        const percentage = scroll.y / limit.y;
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
        scroller: "[data-scroll-container]",
        scrub: true,
        start: "-8% 9%",
        end: "110% 20%",
      },
      scaleX: 4,
      ease: "none",
    });
  }
}

new Home(scroll);
