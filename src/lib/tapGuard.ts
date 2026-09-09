/**
 * Global gesture tracker used to distinguish a real tap from a scroll.
 *
 * iOS Safari fires `touchend` even after a one-finger scroll (it only
 * suppresses the synthetic `click`). Components that navigate on `touchend`
 * must therefore check that the gesture was actually a tap.
 *
 * IMPORTANT: this must only ever CANCEL a navigation that was clearly a
 * scroll. It must never be the gate that decides whether a native link is
 * allowed to work — that silently swallows real clicks (e.g. on ad slots).
 */
let startX = 0;
let startY = 0;
let startTime = 0;
let moved = false;
let sawTouch = false;

const MOVE_TOLERANCE = 16; // px — finger jitter on small sticky elements
const MAX_DURATION = 900; // ms

if (typeof window !== "undefined") {
  window.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      sawTouch = true;
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
      if (
        Math.abs(t.clientX - startX) > MOVE_TOLERANCE ||
        Math.abs(t.clientY - startY) > MOVE_TOLERANCE
      ) {
        moved = true;
      }
    },
    { passive: true, capture: true },
  );
}

/** True when the last touch gesture was a short, stationary tap. */
export const isTapGesture = () =>
  !sawTouch || (!moved && Date.now() - startTime < MAX_DURATION);

/**
 * True only when we are confident the current interaction is the tail of a
 * scroll gesture. Use this to cancel navigation, never to enable it.
 */
export const wasScrollGesture = () => sawTouch && moved;
