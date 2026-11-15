import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GENERIC = "Sign-in failed. Please check your details and try again. If you just signed up, confirm your email first.";
const LOCKED = "Too many attempts. Please wait 15 minutes and try again.";

const caretakerInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const loginCaretaker = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => caretakerInput.parse(input))
  .handler(async ({ data }) => {
    const { admin, clientIp, isLocked, hit, clear, audit, anonClient } = await import("./admin.server");
    const ip = clientIp();
    const accountKey = `login:caretaker:${data.email}`;
    const ipKey = `login:ip:${ip}`;
    if ((await isLocked(accountKey)) || (await isLocked(ipKey))) return { ok: false as const, error: LOCKED };

    const client = await anonClient();
    const { data: auth, error } = await client.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error || !auth.session) {
      await hit(accountKey, 5, 900, 900);
      await hit(ipKey, 20, 900, 900);
      return { ok: false as const, error: GENERIC };
    }
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", auth.user.id);
    if (roles?.some((r) => r.role === "elder")) {
      await client.auth.signOut({ scope: "local" });
      return { ok: false as const, error: GENERIC };
    }
    await clear(accountKey);
    const { data: profile } = await admin.from("profiles").select("family_id").eq("id", auth.user.id).maybeSingle();
    await audit(profile?.family_id ?? null, auth.user.id, "login.caretaker");
    return { ok: true as const, accessToken: auth.session.access_token, refreshToken: auth.session.refresh_token };
  });

const elderInput = z.object({
  familyCode: z.string().trim().toUpperCase().regex(/^CC[A-Z0-9]{6}$/),
  passcode: z.string().min(6).max(32),
});

export const loginElder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = elderInput.safeParse(input);
    if (!parsed.success) return { familyCode: "", passcode: "" };
    return parsed.data;
  })
  .handler(async ({ data }) => {
    if (!data.familyCode) return { ok: false as const, error: GENERIC };
    const { admin, clientIp, isLocked, hit, clear, audit, anonClient } = await import("./admin.server");
    const ip = clientIp();
    const familyKey = `login:elder:${data.familyCode}`;
    const ipKey = `login:ip:${ip}`;
    if ((await isLocked(familyKey)) || (await isLocked(ipKey))) return { ok: false as const, error: LOCKED };

    const fail = async () => {
      await hit(familyKey, 5, 900, 900);
      await hit(ipKey, 20, 900, 900);
      return { ok: false as const, error: "Sign-in failed. Please check the Family ID and passcode." };
    };

    const { data: family } = await admin.from("families").select("id").eq("code", data.familyCode).maybeSingle();
    if (!family) return fail();
    const { data: members } = await admin.from("profiles").select("id").eq("family_id", family.id);
    const ids = (members ?? []).map((m) => m.id);
    if (!ids.length) return fail();
    const { data: elders } = await admin.from("user_roles").select("user_id").eq("role", "elder").in("user_id", ids);

    const client = await anonClient();
    for (const e of elders ?? []) {
      const { data: u } = await admin.auth.admin.getUserById(e.user_id);
      const email = u.user?.email;
      if (!email) continue;
      const { data: auth } = await client.auth.signInWithPassword({ email, password: data.passcode });
      if (auth.session) {
        await clear(familyKey);
        await audit(family.id, e.user_id, "login.elder");
        return { ok: true as const, accessToken: auth.session.access_token, refreshToken: auth.session.refresh_token };
      }
    }
    return fail();
  });
