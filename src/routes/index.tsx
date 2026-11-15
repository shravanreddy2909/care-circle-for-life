import { useState, type CSSProperties, type MouseEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import capturedCSS from "../styles/site.css?raw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareCircle — Calm, dignified medication care for your elders" },
      { name: "description", content: "CareCircle brings caretakers and elders into a shared circle so every tablet is taken on time." },
      { property: "og:title", content: "CareCircle — Calm, dignified medication care for your elders" },
      { property: "og:description", content: "CareCircle brings caretakers and elders into a shared circle so every tablet is taken on time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  staticData: { importedDocument: { html: { "lang": "en" }, body: {  } } },
  component: Index,
});

function Index() {
  const [pointer, setPointer] = useState({ mx: 0, my: 0 });
  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    setPointer({ mx: event.clientX / window.innerWidth - 0.5, my: event.clientY / window.innerHeight - 0.5 });
  };
  return (
    <>
      <style>{capturedCSS}</style>
      <div className={"min-h-screen \x62g-gradient-ivory"} style={{ "--mx": String(pointer.mx), "--my": String(pointer.my) } as CSSProperties} onMouseMove={handlePointerMove}>
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a className="inline-flex items-center gap-2.5" aria-current="page" aria-label="CareCircle home" href="/">
            <span className={"grid size-9 place-items-center rounded-full \x62g-gradient-crimson text-primary-foreground"}>
              <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-primary-deep">CareCircle</span>
          </a>
          <nav className="flex items-center gap-2">
            <a className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-2 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-accent hover:text-accent-foreground h-9 px-4 py-2"} href="/login">Sign in</a>
            <a className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-2 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x62g-gradient-crimson text-primary-foreground \x73hadow-lift \x68over:\x62rightness-110 \x68over:\x2dtranslate-y-0.\x35 transition-all h-9 px-4 py-2"} href="/signup">Create a family</a>
          </nav>
        </header>
        <div className="relative overflow-hidden">
          <div className={"parallax-layer pointer-events-none absolute -left-32 top-10 size-[28rem] rounded-full \x62g-glow"} style={{ "--depth": "-30px" } as CSSProperties} aria-hidden="true" />
          <div className={"parallax-layer pointer-events-none absolute -right-20 bottom-0 size-[22rem] rounded-full \x62g-glow"} style={{ "--depth": "40px" } as CSSProperties} aria-hidden="true" />
          <ImportedSectionCareThatKeepsTime />
        </div>
        <ImportedSection />
        <footer className={"\x62g-gradient-crimson"}>
          <div className={"mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 \x6dd:\x66lex-row"}>
            <a className="inline-flex items-center gap-2.5" aria-current="page" aria-label="CareCircle home" href="/">
              <span className={"grid size-9 place-items-center rounded-full \x62g-ivory text-primary"}>
                <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
                </svg>
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-sidebar-foreground">CareCircle</span>
            </a>
            <p className="text-sm text-sidebar-foreground">This app supports care but is not a substitute for medical advice.</p>
          </div>
        </footer>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} aria-live="polite" aria-relevant="additions text" aria-atomic="false" />
    </>
  );
}

function ImportedSectionCareThatKeepsTime() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const handleTiltMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 6, ry: px * 6 });
  };
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-6 md:grid-cols-[1.05fr_1fr] md:pt-12">
      <div className="fade-up" style={{ transform: "translateY(0px)", opacity: "1" }}>
        <p className="eyebrow mb-4">Elderly care &amp; medication</p>
        <h1 className="text-5xl leading-[1.05] md:text-6xl">Care that keeps <em className="text-primary">time</em>, with dignity.</h1>
        <p className="mt-6 max-w-lg text-lg text-muted-foreground">CareCircle brings up to three caretakers and one or two elders into a quiet, shared circle — so every tablet is taken on time, and nobody misses a missed dose.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className={"inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-2 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x62g-gradient-crimson text-primary-foreground \x73hadow-lift \x68over:\x62rightness-110 \x68over:\x2dtranslate-y-0.\x35 transition-all h-14 rounded-xl px-8 text-base"} href="/signup">Start your family circle</a>
          <a className={"inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-2 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x62g-ivory text-primary-deep \x62order \x62order-border \x73hadow-soft \x68over:\x62g-ivory-deep h-14 rounded-xl px-8 text-base"} href="/login?as=elder">I'm an elder</a>
        </div>
        <p className="text-xs text-muted-foreground mt-6">This app supports care but is not a substitute for medical advice.</p>
      </div>
      <div className="relative">
        <div className={"tilt relative overflow-hidden rounded-[2rem] \x62order \x62order-border \x73hadow-lift"} style={{ "--rx": `${tilt.rx}deg`, "--ry": `${tilt.ry}deg` } as CSSProperties} onMouseMove={handleTiltMove} onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}>
          <img className="h-[30rem] w-full object-cover md:h-[36rem]" src="/site-assets/3b496136eaa0f1f9.jpg" alt="An elderly couple smiling on a sofa as their caretaker rests a hand on the grandmother's shoulder" width="1280" height="1408" />
        </div>
        <div className="parallax-layer absolute -bottom-6 -left-6 md:-left-10" style={{ "--depth": "24px" } as CSSProperties}>
          <div className={"surface-card w-64 p-4 \x73hadow-lift"}>
            <p className="eyebrow">8:00 PM</p>
            <p className="mt-1 font-display text-lg text-primary-deep">Time for your tablet</p>
            <p className="text-sm text-muted-foreground">Metformin · 500 mg</p>
            <div className={"mt-3 rounded-lg \x62g-gradient-crimson px-3 py-2 text-center text-sm font-semibold text-primary-foreground"}>I have taken it</div>
          </div>
        </div>
        <div className={"parallax-layer absolute -right-4 top-8 hidden \x6dd:\x62lock"} style={{ "--depth": "-20px" } as CSSProperties}>
          <div className={"surface-card flex items-center gap-3 px-4 py-3 \x73hadow-lift"}>
            <span className={"grid size-9 place-items-center rounded-full \x62g-success-soft text-success"}>
              <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold">96% this week</p>
              <p className="text-xs text-muted-foreground">Doses taken on time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImportedSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="ornament mb-14" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="surface-card card-lift p-6">
          <span className={"grid size-11 place-items-center rounded-xl \x62g-secondary text-primary"}>
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 14v2.2l1.6 1" />
              <path d="M16 2v4" />
              <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
              <path d="M3 10h5" />
              <path d="M8 2v4" />
              <circle cx="16" cy="16" r="6" />
            </svg>
          </span>
          <h3 className="mt-4 text-xl">Medicine timetable</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add tablets by hand or let AI read a prescription — you confirm every entry.</p>
        </div>
        <div className="surface-card card-lift p-6">
          <span className={"grid size-11 place-items-center rounded-xl \x62g-secondary text-primary"}>
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.268 21a2 2 0 0 0 3.464 0" />
              <path d="M22 8c0-2.3-.8-4.3-2-6" />
              <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
              <path d="M4 2C2.8 3.7 2 5.7 2 8" />
            </svg>
          </span>
          <h3 className="mt-4 text-xl">Gentle reminders</h3>
          <p className="mt-2 text-sm text-muted-foreground">Email before and at dose time, a second nudge, and an alert to all caretakers after 15 minutes.</p>
        </div>
        <div className="surface-card card-lift p-6">
          <span className={"grid size-11 place-items-center rounded-xl \x62g-secondary text-primary"}>
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
              <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
            </svg>
          </span>
          <h3 className="mt-4 text-xl">A big, simple elder screen</h3>
          <p className="mt-2 text-sm text-muted-foreground">Large text, one clear button: “I have taken it”.</p>
        </div>
        <div className="surface-card card-lift p-6">
          <span className={"grid size-11 place-items-center rounded-xl \x62g-secondary text-primary"}>
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
              <path d="M14 2v5a1 1 0 0 0 1 1h5" />
              <path d="M10 9H8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
            </svg>
          </span>
          <h3 className="mt-4 text-xl">Reports, explained</h3>
          <p className="mt-2 text-sm text-muted-foreground">Upload a scan. Get a plain-language summary with unusual values highlighted.</p>
        </div>
        <div className="surface-card card-lift p-6">
          <span className={"grid size-11 place-items-center rounded-xl \x62g-secondary text-primary"}>
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
              <path d="M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 5.004 2.224 3 3 0 0 1-.832 2.083l-3.447 3.62a1 1 0 0 1-1.45-.001z" />
            </svg>
          </span>
          <h3 className="mt-4 text-xl">A kind helper</h3>
          <p className="mt-2 text-sm text-muted-foreground">Elders can ask about their own schedule — by typing or speaking.</p>
        </div>
        <div className="surface-card card-lift p-6">
          <span className={"grid size-11 place-items-center rounded-xl \x62g-secondary text-primary"}>
            <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <h3 className="mt-4 text-xl">Private by design</h3>
          <p className="mt-2 text-sm text-muted-foreground">Every family's data is walled off. Files stay in private storage.</p>
        </div>
      </div>
    </section>
  );
}
