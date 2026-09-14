export const initScrollReveals = (scope) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  const root = scope || document;
  if (!root.querySelectorAll) return () => {};

  const items = Array.from(root.querySelectorAll(".cc-rv:not(.is-inview)"));
  if (!items.length) return () => {};

  const prefersReduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;

  if (prefersReduced || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-inview"));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );

  items.forEach((item, index) => {
    if (!item.style.getPropertyValue("--cc-rv-delay")) {
      item.style.setProperty("--cc-rv-delay", `${Math.min(index * 45, 180)}ms`);
    }
    observer.observe(item);
  });

  return () => observer.disconnect();
};
