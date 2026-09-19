const path = require('path');
const profileData = require('../src/public/profile-data.json');

const buildProfileSection = async (templateCheerio) => {
  const $ = templateCheerio;
  const data = profileData;

  // 1. About
  if (data.about) {
    const aboutContainer = $('.hero__paragraph');
    if (aboutContainer.length > 0) {
      aboutContainer.html(data.about.description);
    }
  }

  // 2. Technical Approach
  if (data.technical_approach) {
    const techApproachContainer = $('.home__content');
    if (techApproachContainer.length > 0) {
      techApproachContainer.html(`
        <h2 class="home__content__title">${data.technical_approach.title}</h2>
        <p class="home__content__desc">${data.technical_approach.description}</p>
      `);
    }
  }

  // 3. Technical Stack
  if (data.technical_stack && data.technical_stack.items) {
    const techStackContainer = $('.home__awards__table');
    if (techStackContainer.length > 0) {
      const itemsHTML = data.technical_stack.items.map(item => `
          <div class="awards__item" data-fade-in="">${item}</div>
       `).join('');
      techStackContainer.html(itemsHTML);
    }
  }

  // 4. Education
  if (data.education) {
    const eduContainer = $('.home__awards__stack');
    if (eduContainer.length > 0) {
      const eduItems = data.education.items.map(item => `${item} <br>`).join(' ');
      const githubLink = data.education.github ? `<a href="${data.education.github.url}" target="_blank" rel="noopener noreferrer">${data.education.github.label}</a>` : '';

      eduContainer.html(`
        <h2 class="home__content__title">${data.education.title}</h2>
        <p class="home__content__desc">
          ${eduItems}
          ${githubLink}
        </p>
      `);
    }
  }

  // 5. Professional Focus
  if (data.professional_focus) {
    const focusContainer = $('.home__awards__ice');
    if (focusContainer.length > 0) {
      focusContainer.html(`
        <h2 class="home__content__title">${data.professional_focus.title}</h2>
        <p class="home__content__desc">${data.professional_focus.description}</p>
      `);
    }
  }
};

module.exports = {
  buildProfileSection
};
