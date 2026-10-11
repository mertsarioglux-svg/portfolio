import type { CardContent } from './textures';

/**
 * Masaüstünde 3D kartı sayfa yüklendikten ve tarayıcı boşa çıktıktan sonra yükler
 * (three.js + fizik motoru ~1 MB, ilk açılışı yavaşlatmasın diye).
 * Mobilde 3D yüklenmez; yerine kaydırdıkça hafifçe dönen düz kart gösterilir.
 */
export function startBadge() {
  const root = document.querySelector<HTMLElement>('[data-badge]');
  const canvas = root?.querySelector<HTMLCanvasElement>('canvas.stage');
  const sleeve = root?.querySelector<HTMLElement>('.still .sleeve');
  if (!root || !canvas || !sleeve) return;

  const desktop = matchMedia('(min-width: 701px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let state: 'idle' | 'loading' | 'live' | 'failed' = 'idle';

  const boot = () => {
    if (state !== 'idle' || !desktop.matches) return;
    state = 'loading';
    whenIdle(async () => {
      try {
        const { createBadge } = await import('./scene');
        const card = JSON.parse(root.dataset.card ?? '{}') as CardContent;
        await createBadge(canvas, { card, reducedMotion: reducedMotion.matches });
        state = 'live';
        requestAnimationFrame(() => root.classList.add('is-live'));
      } catch (error) {
        state = 'failed';
        root.classList.add('is-fallback');
        console.error('Badge could not start:', error);
      }
    });
  };

  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot, { once: true });
  desktop.addEventListener('change', boot);

  // Mobil: kart, bir ekran boyu kaydırınca 7°'den -5°'ye döner.
  let frame = 0;
  const tilt = () => {
    frame = 0;
    const progress = Math.min(Math.max(window.scrollY, 0) / window.innerHeight, 1);
    sleeve.style.setProperty('--tilt', `${reducedMotion.matches ? 7 : 7 - progress * 12}deg`);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!desktop.matches && !frame) frame = requestAnimationFrame(tilt);
    },
    { passive: true },
  );
}

function whenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(callback, { timeout: 1500 });
  else setTimeout(callback, 1);
}
