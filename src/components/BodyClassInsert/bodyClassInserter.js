const PAGE_CLASS_PREFIX = "page-";

// Keep only the current page-* class to avoid style leakage between routes.
export function addBodyClass(className) {
  if (typeof document === "undefined" || !document.body) return;

  const pageClasses = Array.from(document.body.classList).filter((cls) =>
    cls.startsWith(PAGE_CLASS_PREFIX)
  );

  if (pageClasses.length > 0) {
    document.body.classList.remove(...pageClasses);
  }

  if (className) {
    document.body.classList.add(className);
  }
}
