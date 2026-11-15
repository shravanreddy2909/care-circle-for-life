import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { AuthShell } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_RE, passwordProblems } from "@/lib/validation";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create a family — CareCircle" },
      { name: "description", content: "Caretakers create a CareCircle family to manage medicines, reminders and reports for their elders." },
      { property: "og:title", content: "Create a family — CareCircle" },
      { property: "og:description", content: "Start a calm, shared care circle for your elders." },
    ],
  }),
  component: SignupPage,
});

const RULES = ["At least 10 characters", "A lowercase letter", "An uppercase letter", "A number", "A symbol"];

function SignupPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const problems = passwordProblems(password);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const confirm = String(fd.get("confirm") ?? "");
    setError(null);
    if (fullName.length < 1 || fullName.length > 80) return setError("Please enter your name.");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email.");
    if (problems.length) return setError("Please choose a stronger password.");
    if (confirm !== password) return setError("The passwords do not match.");
    setBusy(true);
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/login`, data: { full_name: fullName } },
    });
    setBusy(false);
    if (err) return setError("We couldn't create your account. Please check your details and try again.");
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to start your circle.">
        <p className="text-foreground">We sent a confirmation link to <strong>{sentTo}</strong>. Open it, then sign in to create your family.</p>
        <Button asChild variant="crimson" size="xl" className="mt-6 w-full"><Link to="/login">Go to sign in</Link></Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your family" subtitle="Caretakers sign up here. Elders get their login from you.">
      {error && <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" maxLength={80} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} required aria-describedby="pw-rules" />
          <ul id="pw-rules" className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {RULES.map((r) => {
              const ok = password.length > 0 && !problems.includes(r);
              return (
                <li key={r} className={ok ? "flex items-center gap-1.5 text-success" : "flex items-center gap-1.5 text-muted-foreground"}>
                  {ok ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />} {r}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" maxLength={72} required />
        </div>
        <Button type="submit" variant="crimson" size="xl" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
        <p className="text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
