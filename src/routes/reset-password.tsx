import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { passwordProblems } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — CareCircle" },
      { name: "description", content: "Set a new CareCircle caretaker password." },
      { property: "og:title", content: "Choose a new password — CareCircle" },
      { property: "og:description", content: "Set a new CareCircle caretaker password." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session && isRecovery) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordProblems(password).length) return setError("Please choose a stronger password (10+ characters with upper, lower, number and symbol).");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) return setError("Could not update the password. The link may have expired.");
    toast.success("Password updated");
    navigate({ to: "/login" });
  }

  return (
    <AuthShell title="Choose a new password" subtitle="For caretaker accounts.">
      {!ready ? (
        <p className="text-muted-foreground">Open this page from the reset link in your email.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} />
          </div>
          <Button type="submit" variant="crimson" size="xl" className="w-full">Save password</Button>
        </form>
      )}
    </AuthShell>
  );
}
