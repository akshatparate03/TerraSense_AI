import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Never let the browser restore an old scroll position on refresh/back --
// every page should open at the top.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function jumpToTop() {
  // behavior: "instant" bypasses the global `scroll-behavior: smooth`, which
  // otherwise animates from the previous page's position and can stop midway.
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export default function ScrollToTop() {
  const { pathname } = useLocation();

  // Before paint, so the new page never flashes at the old scroll offset.
  useLayoutEffect(() => {
    jumpToTop();
  }, [pathname]);

  // Again after content/layout settles (lazy content, images, canvases).
  useEffect(() => {
    const raf = requestAnimationFrame(jumpToTop);
    const t = setTimeout(jumpToTop, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname]);

  return null;
}
