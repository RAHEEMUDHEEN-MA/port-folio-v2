import { resolve } from 'path';

export default {
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        project: resolve(__dirname, 'project.html'),
      },
    },
  },
  envDir: "../",
};
