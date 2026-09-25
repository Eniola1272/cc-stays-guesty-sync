export function initSleepCarousels() {
  document.querySelectorAll('[data-sleep-carousel]').forEach((section) => {
    if (section.dataset.sleepReady) return;
    const rail = section.querySelector('[data-sleep-rail]');
    const previous = section.querySelector('[data-sleep-prev]');
    const next = section.querySelector('[data-sleep-next]');
    if (!rail || !previous || !next) return;
    section.dataset.sleepReady = 'true';

    const update = () => {
      previous.disabled = rail.scrollLeft <= 1;
      next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
    };
    const move = (direction) => {
      const card = rail.firstElementChild;
      if (!card) return;
      const step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0);
      rail.scrollBy({
        left: direction * step,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    rail.addEventListener('scroll', update, { passive: true });
    rail.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    new ResizeObserver(update).observe(rail);
    update();
  });
}
