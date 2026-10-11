// "[daha fazla]" paneli: soldan kayarak açılır; Esc, kapat butonu ya da boşluğa tıklama ile kapanır.
const dialog = document.querySelector<HTMLDialogElement>('#about');
const panel = dialog?.querySelector<HTMLElement>('.panel');

if (dialog && panel) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => dialog.classList.add('shown'));
  };

  const close = () => {
    if (!dialog.open || !dialog.classList.contains('shown')) return;
    dialog.classList.remove('shown');

    let done = false;
    const finish = () => {
      if (done || dialog.classList.contains('shown')) return;
      done = true;
      panel.removeEventListener('transitionend', onTransitionEnd);
      dialog.close();
      document.documentElement.style.overflow = '';
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === panel && event.propertyName === 'transform') finish();
    };

    if (reducedMotion.matches) return finish();
    panel.addEventListener('transitionend', onTransitionEnd);
    setTimeout(finish, 600);
  };

  document.querySelectorAll('[data-open-about]').forEach((button) => button.addEventListener('click', open));
  dialog.querySelector('[data-close-about]')?.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
}
