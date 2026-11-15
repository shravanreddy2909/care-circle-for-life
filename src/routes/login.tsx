import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { loginCaretaker, loginElder } from "@/lib/auth.functions";
import { EMAIL_RE, normaliseFamilyCode } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Search = { as?: "elder" | "caretaker" | undefined; redirect?: string | undefined };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    as: s["as"] === "elder" ? "elder" : s["as"] === "caretaker" ? "caretaker" : undefined,
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//") ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CareCircle" },
      { name: "description", content: "Sign in to CareCircle as a caretaker with email, or as an elder with your Family ID and passcode." },
      { property: "og:title", content: "Sign in — CareCircle" },
      { property: "og:description", content: "Caretakers and elders sign in to their shared CareCircle." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"caretaker" | "elder">(search.as ?? "caretaker");
  const [forgot, setForgot] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const caretakerFn = useServerFn(loginCaretaker);
  const elderFn = useServerFn(loginElder);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(res: { ok: true; accessToken: string; refreshToken: string } | { ok: false; error: string }) {
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const { error: sessionError } = await supabase.auth.setSession({ access_token: res.accessToken, refresh_token: res.refreshToken });
    if (sessionError) {
      setError("Sign-in failed. Please try again.");
      return;
    }
    queryClient.removeQueries({ queryKey: ["me"] });
    navigate({ to: search.redirect ?? "/", replace: true });
  }

  async function onCaretaker(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setError(null);
    if (!EMAIL_RE.test(email) || !password) return setError("Please enter your email and password.");
    setBusy(true);
    try {
      await finish(await caretakerFn({ data: { email, password } }));
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onElder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const familyCode = normaliseFamilyCode(String(fd.get("familyCode") ?? ""));
    const passcode = String(fd.get("passcode") ?? "");
    setError(null);
    if (!familyCode || passcode.length < 6) return setError("Please enter your Family ID and passcode.");
    setBusy(true);
    try {
      await finish(await elderFn({ data: { familyCode, passcode } }));
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email.");
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    toast.success("If that email has an account, a reset link is on its way.");
    setForgot(false);
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your family's care circle.">
      <div role="tablist" aria-label="Who is signing in" className="mb-6 grid grid-cols-2 rounded-xl bg-secondary p-1">
        {(["caretaker", "elder"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setError(null); setForgot(false); }}
            className={cn("rounded-lg py-2.5 text-sm font-semibold transition-colors", mode === m ? "bg-card text-primary shadow-soft" : "text-muted-foreground hover:text-primary-deep")}
          >
            {m === "caretaker" ? "Caretaker" : "Elder"}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {mode === "caretaker" && !forgot && (
        <form onSubmit={onCaretaker} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
          </div>
          <Button type="submit" variant="crimson" size="xl" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => setForgot(true)}>Forgot password?</button>
            <Link to="/signup" className="text-primary underline-offset-4 hover:underline">Create a family</Link>
          </div>
        </form>
      )}

      {mode === "caretaker" && forgot && (
        <form onSubmit={onForgot} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Your email</Label>
            <Input id="reset-email" name="email" type="email" autoComplete="email" required />
          </div>
          <Button type="submit" variant="crimson" size="xl" className="w-full" disabled={busy}>Send reset link</Button>
          <button type="button" className="text-sm text-primary hover:underline" onClick={() => setForgot(false)}>Back to sign in</button>
        </form>
      )}

      {mode === "elder" && (
        <form onSubmit={onElder} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="familyCode" className="text-base">Family ID</Label>
            <Input id="familyCode" name="familyCode" autoComplete="username" placeholder="CC7K3P9Q" className="h-14 text-xl uppercase tracking-widest" maxLength={12} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="passcode" className="text-base">Passcode</Label>
            <Input id="passcode" name="passcode" type="password" autoComplete="current-password" className="h-14 text-xl" maxLength={32} required />
          </div>
          <Button type="submit" variant="crimson" size="xl" className="h-16 w-full text-lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          <p className="text-sm text-muted-foreground">Your caretaker gives you your Family ID and passcode.</p>
        </form>
      )}
    </AuthShell>
  );
}
