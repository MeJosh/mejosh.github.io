// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://joshelliott.me',
  integrations: [
    mdx(),
    vue(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
