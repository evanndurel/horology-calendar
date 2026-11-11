import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const site = (env.VITE_SITE_URL || '').replace(/\/$/, '');
  return {
    plugins: [{
      name: 'site-url',
      // Absolute link to the share image (needed by LinkedIn, WhatsApp...)
      transformIndexHtml: (html) => html.replace('content="/og.png"', 'content="' + site + '/og.png"'),
    }],
    build: { chunkSizeWarningLimit: 1200 },
  };
});
