// Fareyle bir projenin üstüne gelince o satır öne çıkar, görselleri açılır, diğerleri bulanıklaşır.
const section = document.querySelector<HTMLElement>('#work');

if (section) {
  const items = [...section.querySelectorAll<HTMLElement>('.project')];
  let hovered: number | null = null;
  let focused: number | null = null;

  const update = () => {
    const active = hovered ?? focused;
    items.forEach((item, i) => {
      item.classList.toggle('active', active === i);
      item.classList.toggle('muted', active !== null && active !== i);
    });
  };

  items.forEach((item, i) => {
    item.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      hovered = i;
      update();
    });
    item.addEventListener('pointerleave', () => {
      hovered = null;
      update();
    });
    item.addEventListener('focusin', () => {
      focused = i;
      update();
    });
    item.addEventListener('focusout', () => {
      focused = null;
      update();
    });
  });
}
