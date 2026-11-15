import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "caretaker" | "elder";

export type Family = {
  id: string;
  code: string;
  name: string;
  timezone: string;
  pre_reminder_minutes: number;
  second_reminder_minutes: number;
  missed_after_minutes: number;
  email_enabled: boolean;
  email_dry_run: boolean;
  is_sample: boolean;
};

export type Me = {
  userId: string;
  fullName: string;
  email: string | null;
  role: AppRole | null;
  family: Family | null;
};

export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: async (): Promise<Me | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, family_id").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    let family: Family | null = null;
    if (profile?.family_id) {
      const { data } = await supabase
        .from("families")
        .select("id, code, name, timezone, pre_reminder_minutes, second_reminder_minutes, missed_after_minutes, email_enabled, email_dry_run, is_sample")
        .eq("id", profile.family_id)
        .maybeSingle();
      family = data ?? null;
    }
    return {
      userId: user.id,
      fullName: profile?.full_name || "",
      email: profile?.email ?? null,
      role: (roles?.[0]?.role as AppRole | undefined) ?? null,
      family,
    };
  },
  staleTime: 30_000,
});

export type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
};

export const membersQueryOptions = (familyId: string) =>
  queryOptions({
    queryKey: ["members", familyId],
    queryFn: async (): Promise<Member[]> => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .eq("family_id", familyId)
        .order("created_at");
      if (error) throw error;
      const ids = (profiles ?? []).map((p) => p.id);
      if (!ids.length) return [];
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as AppRole]));
      return (profiles ?? [])
        .filter((p) => roleMap.has(p.id))
        .map((p) => ({ ...p, role: roleMap.get(p.id)! }));
    },
  });
