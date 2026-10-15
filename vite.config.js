import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages needs a repository subpath; Cloudflare Pages serves from the domain root.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/fitlife-ai-planner/' : '/',
  plugins: [react()],
});
