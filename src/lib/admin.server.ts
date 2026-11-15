// Server-only helpers that need the privileged backend client.
import { getRequestHeader } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export const admin = supabaseAdmin;

export function clientIp() {
  return (
    getRequestHeader("cf-connecting-ip") ||
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function isLocked(key: string) {
  const { data } = await admin.rpc("rate_limit_is_locked", { _key: key });
  return data === true;
}

/** Counts one attempt. Returns false when the key is now locked. */
export async function hit(key: string, max: number, windowSeconds: number, lockSeconds: number) {
  const { data, error } = await admin.rpc("rate_limit_hit", {
    _key: key, _max: max, _window_seconds: windowSeconds, _lock_seconds: lockSeconds,
  });
  if (error) {
    console.error("rate limit error", error.code);
    return true;
  }
  return data === true;
}

export async function clear(key: string) {
  await admin.rpc("rate_limit_clear", { _key: key });
}

export async function audit(familyId: string | null, actorId: string | null, action: string, details: Record<string, unknown> = {}) {
  await admin.from("audit_log").insert({ family_id: familyId, actor_id: actorId, action, details: details as Json });
}

/** Loads the caller's family and role using the privileged client (after auth middleware verified the user). */
export async function callerContext(userId: string) {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    admin.from("profiles").select("id, family_id, full_name").eq("id", userId).maybeSingle(),
    admin.from("user_roles").select("role").eq("user_id", userId),
  ]);
  return {
    familyId: profile?.family_id ?? null,
    fullName: profile?.full_name ?? "",
    role: (roles?.[0]?.role ?? null) as "caretaker" | "elder" | null,
  };
}

export async function requireCaretaker(userId: string) {
  const ctx = await callerContext(userId);
  if (ctx.role !== "caretaker" || !ctx.familyId) throw new Error("Not allowed");
  return ctx as { familyId: string; fullName: string; role: "caretaker" };
}

export async function requireElder(userId: string) {
  const ctx = await callerContext(userId);
  if (ctx.role !== "elder" || !ctx.familyId) throw new Error("Not allowed");
  return ctx as { familyId: string; fullName: string; role: "elder" };
}

export function anonClient() {
  // Lazy import keeps this module light; a fresh client per call never persists sessions.
  return import("@supabase/supabase-js").then(({ createClient }) => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
  });
}
