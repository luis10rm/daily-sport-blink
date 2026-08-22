/**
 * Global gesture tracker used to distinguish a real tap from a scroll.
 *
 * iOS Safari fires `touchend` even after a one-finger scroll (it only
 * suppresses the synthetic `click`). Components that navigate on `touchend`
 * must therefore check that the gesture was actually a tap.
 */
let startX = 0;
let startY = 0;
let startTime = 0;
let moved = false;

const MOVE_TOLERANCE = 10; // px
const MAX_DURATION = 700; // ms

if (typeof window !== "undefined") {
  window.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      moved = false;
    },
    { passive: true, capture: true },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      if (Math.abs(t.clientX - startX) > MOVE_TOLERANCE || Math.abs(t.clientY - startY) > MOVE_TOLERANCE) {
        moved = true;
      }
    },
    { passive: true, capture: true },
  );

  window.addEventListener("touchcancel", () => {
    moved = true;
  }, { passive: true, capture: true });
}

/** True when the last touch gesture was a short, stationary tap. */
export const isTapGesture = () => !moved && Date.now() - startTime < MAX_DURATION;
