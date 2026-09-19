const fs = require('fs/promises');
const path = require('path');
const projectData = require('../src/public/project-data.json');

const buildSitemap = async () => {
  const domain = 'https://raheemudheen.com';
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add homepage
  sitemapXml += `  <url>\n    <loc>${domain}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Add project pages
  for (const project of projectData) {
    if (project.public === false) continue;
    
    sitemapXml += `  <url>\n    <loc>${domain}/projects/${project.id}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  sitemapXml += `</urlset>`;

  const outputPath = path.resolve(__dirname, '../src/public/sitemap.xml');
  await fs.writeFile(outputPath, sitemapXml, 'utf8');
  console.log('Sitemap generated successfully.');
};

module.exports = { buildSitemap };
