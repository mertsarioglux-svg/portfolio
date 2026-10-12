// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Yayına alınca gerçek alan adını buraya yaz (canonical ve hreflang linkleri için).
  site: 'https://example.com',
  trailingSlash: 'ignore',
  // Stiller ayrı dosya yerine sayfanın içine gömülür. Vercel /_astro/ altındaki yanıtları (404 dahil)
  // tarayıcıda bir yıl sakladığı için, dağıtım anında açılan sayfa stil dosyasını "bulunamadı" olarak
  // saklayıp stilsiz kalabiliyordu. Sayfa her açılışta yeniden doğrulandığı için stiller hep güncel gelir.
  build: { inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  integrations: [mdx()],
  vite: {
    // 3D kart sonradan (dinamik) yüklendiği için bu paketleri geliştirme sunucusu baştan hazırlasın.
    optimizeDeps: { include: ['three', '@dimforge/rapier3d-compat'] },
  },
});
