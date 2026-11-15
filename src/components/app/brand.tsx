import { Link } from "@tanstack/react-router";
import { HeartHandshake } from "lucide-react";
import { DISCLAIMER } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function Logo({ to = "/", light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5" aria-label="CareCircle home">
      <span className={cn("grid size-9 place-items-center rounded-full", light ? "bg-card text-primary" : "bg-gradient-crimson text-primary-foreground")}>
        <HeartHandshake className="size-5" aria-hidden="true" />
      </span>
      <span className={cn("font-display text-xl font-semibold tracking-tight", light ? "text-sidebar-foreground" : "text-primary-deep")}>
        CareCircle
      </span>
    </Link>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{DISCLAIMER}</p>;
}

export function StatusBadge({ status, large = false }: { status: "upcoming" | "taken" | "missed"; large?: boolean }) {
  const label = status === "taken" ? "Taken" : status === "missed" ? "Missed" : "Upcoming";
  return (
    <span className={cn("inline-flex items-center rounded-full font-semibold", `status-${status}`, large ? "px-4 py-1.5 text-lg" : "px-2.5 py-0.5 text-xs")}>
      {label}
    </span>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl md:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="dashed-slot px-6 py-10 text-center text-muted-foreground">{children}</div>;
}
