import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read project data to dynamically add project pages to inputs
const projectData = JSON.parse(readFileSync(resolve(__dirname, 'public/project-data.json'), 'utf-8'));
const projectInputs = {};
projectData.forEach(p => {
  if (p.public !== false) {
    projectInputs[`project_${p.id}`] = resolve(__dirname, `projects/${p.id}/index.html`);
  }
});

export default {
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        project: resolve(__dirname, 'project.html'),
        ...projectInputs,
      },
    },
  },
  envDir: "../",
};
