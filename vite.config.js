import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves this repository under /fitlife-ai-planner/.
  base: '/fitlife-ai-planner/',
  plugins: [react()],
});
