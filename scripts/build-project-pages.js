const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');
const projectData = require('../src/public/project-data.json');

const buildProjectPages = async () => {
  const templatePath = path.resolve(__dirname, '../src/project.html');
  const templateHtml = await fs.readFile(templatePath, 'utf8');

  for (const project of projectData) {
    if (project.public === false) {
      continue;
    }

    const $ = cheerio.load(templateHtml);

    // Inject SEO Metadata
    const domain = "https://raheemudheen.com";
    const canonicalUrl = `${domain}/projects/${project.id}/`;
    const description = project.description || "";
    const imageUrl = project.architecture_image ? `${domain}/${project.architecture_image}` : `${domain}/og-image.jpg`;

    $('title').text(`${project.title} — RAHEEMUDHEEN M A`);
    
    const updateMeta = (name, content, attr = 'name') => {
      if (!content) return;
      let meta = $(`meta[${attr}="${name}"]`);
      if (meta.length === 0) {
        $('head').append(`\n    <meta ${attr}="${name}" content="">`);
        meta = $(`meta[${attr}="${name}"]`);
      }
      meta.attr('content', content);
    };

    updateMeta('description', description, 'name');
    
    updateMeta('og:title', project.title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:url', canonicalUrl, 'property');
    updateMeta('og:type', 'article', 'property');
    updateMeta('og:image', imageUrl, 'property');
    
    updateMeta('twitter:card', 'summary_large_image', 'name');
    updateMeta('twitter:title', project.title, 'name');
    updateMeta('twitter:description', description, 'name');
    updateMeta('twitter:image', imageUrl, 'name');

    // Canonical link
    if ($('link[rel="canonical"]').length === 0) {
      $('head').append(`\n    <link rel="canonical" href="${canonicalUrl}">`);
    } else {
      $('link[rel="canonical"]').attr('href', canonicalUrl);
    }

    // JSON-LD
    const isSoftwareApp = /platform|dashboard|system|ui|framework/i.test(project.title) || /platform|dashboard|system|ui|framework/i.test(project.description);
    const schemaType = isSoftwareApp ? "SoftwareApplication" : "CreativeWork";
    const structuredData = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "name": project.title,
      "description": project.description,
      "url": canonicalUrl,
      "author": {
        "@type": "Person",
        "name": "Raheemudheen M A"
      }
    };
    if (isSoftwareApp) {
      structuredData.applicationCategory = "WebApplication";
    }
    if (project.architecture_image) {
      structuredData.image = imageUrl;
    }

    $('head').append(`\n    <script id="project-json-ld" type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`);

    // Modify base paths for CSS/JS since this will be in /projects/<slug>/index.html
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http') && !href.startsWith('/')) {
        $(el).attr('href', '/' + href);
      }
    });
    $('link[rel="icon"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('http') && !href.startsWith('/')) {
          $(el).attr('href', '/' + href);
        }
    });
    $('script').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('./')) {
        $(el).attr('src', src.replace('./', '/'));
      } else if (src && !src.startsWith('http') && !src.startsWith('/')) {
        $(el).attr('src', '/' + src);
      }
    });

    // Remove the redirect script if it's there
    $('#redirect-script').remove();

    // Render Project HTML
    const designDecisions = project.design_decisions ? project.design_decisions.map(d => `<li>${d}</li>`).join('') : '';
    const technicalHighlights = project.technical_highlights ? project.technical_highlights.map(h => `<li>${h}</li>`).join('') : '';
    const impactMetrics = project.impact_metrics ? project.impact_metrics.map(m => `<li>${m}</li>`).join('') : '';
    const links = project.links ? project.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`).join(' / ') : '';

    let attachmentsHtml = '';
    if (project.attachments && project.attachments.length > 0) {
      const items = project.attachments.map((att, index) => {
        const isPdf = att.url.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          return `
            <a href="/${att.url}" target="_blank" rel="noopener noreferrer" class="attachment-item pdf-item" aria-label="Open PDF: ${att.caption}">
              <span class="pdf-icon">PDF</span>
              <span class="pdf-caption">${att.caption}</span>
            </a>
          `;
        }
        return `
          <button class="attachment-item image-item" data-index="${index}" aria-label="View screenshot: ${att.caption}">
            <img class="attachment-thumb" src="/${att.url}" alt="${att.alt}" loading="lazy" />
          </button>
        `;
      }).join('');
      attachmentsHtml = `
        <div class="section attachments-grid-container">
           <h3>Interface Snapshots & Docs</h3>
           <div class="attachments-grid">
             ${items}
           </div>
           <p class="attachments-disclaimer">Screens shown are representative and anonymized.</p>
        </div>
      `;
    }

    const modalHtml = `
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

    const htmlContent = `
      <div class="project-header" data-scroll-section>
        <h1 class="project-title">${project.title}</h1>
        <p class="project-role">${project.role}</p>
      </div>

      <div class="project-body" data-scroll-section>
         <div class="section context">
           <h3>Context</h3>
           <p>${project.description}</p>
         </div>

         ${project.problem_statement ? `
         <div class="section problem">
           <h3>Problem Statement</h3>
           <p>${project.problem_statement}</p>
         </div>
         ` : ''}

         ${project.architecture_image ? `
         <div class="section architecture">
           <h3>Architecture Overview</h3>
           <div class="architecture-diagram">
              <img src="/${project.architecture_image}" alt="Architecture Diagram for ${project.title}" class="architecture-img" style="max-width: 100%; height: auto;" onerror="this.closest('.section.architecture').style.display='none'" />
           </div>
         </div>
         ` : ''}

         ${technicalHighlights ? `
         <div class="section technical-highlights">
           <h3>Technical Highlights</h3>
           <ul class="styled-list">
             ${technicalHighlights}
           </ul>
         </div>
         ` : ''}

         ${designDecisions ? `
         <div class="section decisions">
           <h3>System Flow / Design Decisions</h3>
           <ul class="styled-list">
             ${designDecisions}
           </ul>
         </div>
         ` : ''}

         ${impactMetrics ? `
         <div class="section impact">
           <h3>Impact & Outcomes</h3>
           <ul class="styled-list">
             ${impactMetrics}
           </ul>
         </div>
         ` : ''}

         ${links ? `
         <div class="section pro-links">
           ${links}
         </div>
         ` : ''}
         
         ${attachmentsHtml}
      </div>
      ${modalHtml}
    `;

    $('#js-project-content').html(htmlContent);

    // Save generated HTML to src/projects/<slug>/index.html
    const dir = path.resolve(__dirname, `../src/projects/${project.id}`);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), $.html(), 'utf8');
  }

  console.log('Project pages built successfully.');
};

module.exports = { buildProjectPages };
