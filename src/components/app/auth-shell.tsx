import type { ReactNode } from "react";
import { useParallax, useTilt } from "@/hooks/use-parallax";
import { Disclaimer, Logo } from "./brand";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const parallax = useParallax();
  const tilt = useTilt(4);
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-ivory" {...parallax}>
      <div className="parallax-layer pointer-events-none absolute -left-32 top-10 size-[28rem] rounded-full bg-glow" style={{ "--depth": "-30px" } as React.CSSProperties} aria-hidden="true" />
      <div className="parallax-layer pointer-events-none absolute -right-20 bottom-0 size-[22rem] rounded-full bg-glow" style={{ "--depth": "40px" } as React.CSSProperties} aria-hidden="true" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
      </header>
      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 md:grid-cols-[1fr_1fr]">
        <div className="fade-up">
          <div className="tilt surface-card p-7 md:p-9" {...tilt}>
            <h1 className="text-3xl md:text-4xl">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
          <Disclaimer className="mt-5" />
        </div>
        <div className="relative hidden md:block">
          <div className="parallax-layer overflow-hidden rounded-[2rem] border border-border shadow-lift" style={{ "--depth": "14px" } as React.CSSProperties}>
            <img src="/site-assets/3b496136eaa0f1f9.jpg" alt="An elderly couple smiling on a sofa with their caretaker" className="h-[34rem] w-full object-cover" width={1280} height={1408} />
          </div>
          <div className="parallax-layer absolute -bottom-6 -left-8" style={{ "--depth": "28px" } as React.CSSProperties}>
            <div className="surface-card w-60 p-4 shadow-lift">
              <p className="eyebrow">Calm & on time</p>
              <p className="mt-1 font-display text-lg text-primary-deep">Every tablet, remembered.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
