const fs = require("fs/promises");
const cheerio = require("cheerio");
const { buildProjectsSection } = require("./build-projects");
const { buildProjectPages } = require("./build-project-pages");
const { buildSitemap } = require("./build-sitemap");
const { buildProfileSection } = require("./build-profile");

const buildHtml = async () => {
  const template = await fs.readFile("./src/index.html", "utf8");
  const templateCheerio = cheerio.load(template);

  await buildProjectsSection(templateCheerio);
  await buildProjectPages();
  await buildSitemap();
  await buildProfileSection(templateCheerio);

  return templateCheerio;
};

// call the buildGlyphs function
buildHtml()
  .then(($) => {
    // write the html to the src folder
    fs.writeFile("./src/index.html", $.html());
  })
  .catch((err) => {
    console.log(err);
  });
