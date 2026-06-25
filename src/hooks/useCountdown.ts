import { useEffect, useState } from "react";

/** Live countdown to a target ISO timestamp. Ticks every 60s, or every 1s when <1h away. Pauses when tab hidden. */
export const useCountdown = (iso: string | undefined): number => {
  const [ms, setMs] = useState(() => (iso ? new Date(iso).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!iso) return;
    const target = new Date(iso).getTime();
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => setMs(target - Date.now());
    const start = () => {
      tick();
      if (timer) clearInterval(timer);
      const interval = target - Date.now() < 60 * 60 * 1000 ? 1000 : 60_000;
      timer = setInterval(tick, interval);
    };
    const onVis = () => {
      if (document.hidden) {
        if (timer) { clearInterval(timer); timer = null; }
      } else {
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [iso]);
  return ms;
};

export const formatCountdown = (ms: number): string => {
  if (ms <= 0) return "lada moment";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "za chwilę";
  const min = Math.floor(sec / 60);
  if (min < 60) return `za ${min} min`;
  const h = Math.floor(min / 60);
  const remMin = min % 60;
  if (h < 24) return `za ${h}h ${remMin}m`;
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return `za ${d}d ${remH}h`;
};

export const splitCountdown = (ms: number) => {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
};
