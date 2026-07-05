// Lightweight confetti burst using Web Animations API — no external deps.
// Colors tuned to lime/positive palette.

const COLORS = ["#84cc16", "#a3e635", "#bef264", "#ecfccb", "#ffffff", "#f59e0b"];

export interface ConfettiOptions {
  count?: number;
  spread?: number; // px radius
  duration?: number; // ms
}

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const burstConfetti = (x: number, y: number, opts: ConfettiOptions = {}) => {
  if (typeof document === "undefined") return;
  if (prefersReducedMotion()) return;

  const { count = 26, spread = 160, duration = 900 } = opts;

  const layer = document.createElement("div");
  layer.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:9999;`;
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    const size = 6 + Math.random() * 6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isCircle = Math.random() > 0.6;
    piece.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * (isCircle ? 1 : 0.55)}px;background:${color};border-radius:${isCircle ? "50%" : "1px"};will-change:transform,opacity;`;
    layer.appendChild(piece);

    const angle = Math.random() * Math.PI * 2;
    const distance = spread * (0.5 + Math.random() * 0.5);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 60 - Math.random() * 40; // bias upwards
    const rot = (Math.random() * 720 - 360).toFixed(0);
    const dur = duration + Math.random() * 400;

    piece.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      {
        duration: dur,
        easing: "cubic-bezier(0.15, 0.85, 0.35, 1)",
        fill: "forwards",
      }
    );
  }

  window.setTimeout(() => {
    layer.remove();
  }, duration + 500);
};
