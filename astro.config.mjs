// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Yayına alınca gerçek alan adını buraya yaz (canonical ve hreflang linkleri için).
  site: 'https://example.com',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  integrations: [mdx()],
  vite: {
    // 3D kart sonradan (dinamik) yüklendiği için bu paketleri geliştirme sunucusu baştan hazırlasın.
    optimizeDeps: { include: ['three', '@dimforge/rapier3d-compat'] },
  },
});
