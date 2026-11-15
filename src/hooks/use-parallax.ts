import { useState, type CSSProperties, type MouseEvent } from "react";

/** Cursor-reactive parallax: exposes --mx/--my (-0.5..0.5) on the container. */
export function useParallax() {
  const [pos, setPos] = useState({ mx: 0, my: 0 });
  return {
    style: { "--mx": String(pos.mx), "--my": String(pos.my) } as CSSProperties,
    onMouseMove: (e: MouseEvent<HTMLElement>) =>
      setPos({ mx: e.clientX / window.innerWidth - 0.5, my: e.clientY / window.innerHeight - 0.5 }),
  };
}

/** Pop-out tilt for a single card. */
export function useTilt(strength = 6) {
  const [t, setT] = useState({ rx: 0, ry: 0 });
  return {
    style: { "--rx": `${t.rx}deg`, "--ry": `${t.ry}deg` } as CSSProperties,
    onMouseMove: (e: MouseEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setT({ rx: -((e.clientY - r.top) / r.height - 0.5) * strength, ry: ((e.clientX - r.left) / r.width - 0.5) * strength });
    },
    onMouseLeave: () => setT({ rx: 0, ry: 0 }),
  };
}
