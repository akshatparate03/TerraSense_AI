import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Thin gradient progress bar fixed to the top of the viewport, filled as
 * the page scrolls. Plain scroll-listener implementation -- no external
 * animation library required, so it can never fail to load. Purely
 * decorative: it never touches layout, opacity, or visibility of page
 * content. Recomputed on every route change since each page has a
 * different scrollable height.
 */
export default function ScrollProgressBar() {
  const barRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    let raf = null;

    const update = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        update();
        raf = null;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [location.pathname]);

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[100] h-[3px] w-full bg-transparent">
      <div
        ref={barRef}
        className="h-full w-full origin-left bg-gradient-to-r from-accent-cyan to-accent-blue transition-transform duration-150 ease-out"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
