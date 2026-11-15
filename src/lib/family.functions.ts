import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isStrongPassword, passcodeProblem } from "./validation";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function familyCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "CC" + Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

const name = z.string().trim().min(1).max(80);
const email = z.string().trim().toLowerCase().email().max(254);
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/).nullable();

export const createFamily = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ familyName: z.string().trim().min(1).max(80), timezone: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { admin, callerContext, audit } = await import("./admin.server");
    const { isValidTimeZone } = await import("./time");
    const me = await callerContext(context.userId);
    if (me.familyId || me.role) throw new Error("You already belong to a family");
    if (!isValidTimeZone(data.timezone)) throw new Error("Please choose a valid time zone");

    let familyId: string | null = null;
    let code = "";
    for (let i = 0; i < 5 && !familyId; i++) {
      code = familyCode();
      const { data: fam, error } = await admin
        .from("families")
        .insert({ code, name: data.familyName, timezone: data.timezone, created_by: context.userId })
        .select("id")
        .single();
      if (!error) familyId = fam.id;
      else if (error.code !== "23505") throw new Error("Could not create the family");
    }
    if (!familyId) throw new Error("Could not create the family");
    await admin.from("profiles").update({ family_id: familyId }).eq("id", context.userId);
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: context.userId, role: "caretaker" });
    if (roleError) {
      await admin.from("families").delete().eq("id", familyId);
      throw new Error("Could not create the family");
    }
    await audit(familyId, context.userId, "role.caretaker_assigned", { reason: "created family" });
    return { familyId, code };
  });

export const addCaretaker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ fullName: name, email, password: z.string().max(72) }).parse(input))
  .handler(async ({ data, context }) => {
    const { admin, requireCaretaker, audit, hit } = await import("./admin.server");
    const me = await requireCaretaker(context.userId);
    if (!isStrongPassword(data.password)) throw new Error("Please choose a stronger password");
    if (!(await hit(`members:${me.familyId}`, 10, 3600, 3600))) throw new Error("Too many changes. Please try later.");
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("family_id", me.familyId);
    void count;
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true, user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error("Could not add this caretaker. The email may already be in use.");
    const uid = created.user.id;
    await admin.from("profiles").update({ family_id: me.familyId, full_name: data.fullName, email: data.email }).eq("id", uid);
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: uid, role: "caretaker" });
    if (roleError) {
      await admin.auth.admin.deleteUser(uid);
      throw new Error(roleError.message.includes("at most") ? roleError.message : "Could not add this caretaker");
    }
    await audit(me.familyId, context.userId, "role.caretaker_added", { name: data.fullName });
    return { ok: true };
  });

async function passcodeClashes(familyId: string, passcode: string, exceptId?: string) {
  const { admin, anonClient } = await import("./admin.server");
  const { data: members } = await admin.from("profiles").select("id").eq("family_id", familyId);
  const ids = (members ?? []).map((m) => m.id).filter((id) => id !== exceptId);
  if (!ids.length) return false;
  const { data: elders } = await admin.from("user_roles").select("user_id").eq("role", "elder").in("user_id", ids);
  const client = await anonClient();
  for (const e of elders ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(e.user_id);
    if (!u.user?.email) continue;
    const { data: auth } = await client.auth.signInWithPassword({ email: u.user.email, password: passcode });
    if (auth.session) {
      await client.auth.signOut({ scope: "local" });
      return true;
    }
  }
  return false;
}

export const addElder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ fullName: name, email, phone, passcode: z.string().max(32) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { admin, requireCaretaker, audit, hit } = await import("./admin.server");
    const me = await requireCaretaker(context.userId);
    const problem = passcodeProblem(data.passcode);
    if (problem) throw new Error(problem);
    if (!(await hit(`members:${me.familyId}`, 10, 3600, 3600))) throw new Error("Too many changes. Please try later.");
    if (await passcodeClashes(me.familyId, data.passcode)) throw new Error("Please use a different passcode for each elder");
    const loginEmail = `elder-${crypto.randomUUID()}@elders.carecircle.app`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email: loginEmail, password: data.passcode, email_confirm: true,
      user_metadata: { full_name: data.fullName, kind: "elder", contact_email: data.email },
    });
    if (error || !created.user) throw new Error("Could not create the elder account. Try a longer passcode.");
    const uid = created.user.id;
    await admin.from("profiles").update({ family_id: me.familyId, full_name: data.fullName, email: data.email, phone: data.phone }).eq("id", uid);
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: uid, role: "elder" });
    if (roleError) {
      await admin.auth.admin.deleteUser(uid);
      throw new Error(roleError.message.includes("at most") ? roleError.message : "Could not add this elder");
    }
    await audit(me.familyId, context.userId, "role.elder_added", { name: data.fullName });
    const { data: fam } = await admin.from("families").select("code").eq("id", me.familyId).single();
    return { familyCode: fam?.code ?? "" };
  });

export const updateMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ memberId: z.string().uuid(), fullName: name, email: email.nullable(), phone }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { admin, requireCaretaker, audit, callerContext } = await import("./admin.server");
    const me = await requireCaretaker(context.userId);
    const target = await callerContext(data.memberId);
    if (target.familyId !== me.familyId) throw new Error("Not allowed");
    const patch: { full_name: string; phone?: string | null; email?: string | null } = { full_name: data.fullName };
    if (target.role === "elder") {
      patch.phone = data.phone;
      patch.email = data.email;
    }
    await admin.from("profiles").update(patch).eq("id", data.memberId);
    await audit(me.familyId, context.userId, "member.updated", { name: data.fullName });
    return { ok: true };
  });

export const resetElderPasscode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId: z.string().uuid(), passcode: z.string().max(32) }).parse(input))
  .handler(async ({ data, context }) => {
    const { admin, requireCaretaker, audit, callerContext } = await import("./admin.server");
    const me = await requireCaretaker(context.userId);
    const target = await callerContext(data.memberId);
    if (target.familyId !== me.familyId || target.role !== "elder") throw new Error("Not allowed");
    const problem = passcodeProblem(data.passcode);
    if (problem) throw new Error(problem);
    if (await passcodeClashes(me.familyId, data.passcode, data.memberId)) throw new Error("Please use a different passcode for each elder");
    const { error } = await admin.auth.admin.updateUserById(data.memberId, { password: data.passcode });
    if (error) throw new Error("Could not change the passcode. Try a longer one.");
    await audit(me.familyId, context.userId, "member.passcode_reset", { name: target.fullName });
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { admin, requireCaretaker, audit, callerContext } = await import("./admin.server");
    const me = await requireCaretaker(context.userId);
    if (data.memberId === context.userId) throw new Error("You cannot remove yourself");
    const target = await callerContext(data.memberId);
    if (target.familyId !== me.familyId || !target.role) throw new Error("Not allowed");
    const { error } = await admin.auth.admin.deleteUser(data.memberId);
    if (error) throw new Error("Could not remove this member");
    await audit(me.familyId, context.userId, `role.${target.role}_removed`, { name: target.fullName });
    return { ok: true };
  });

export const deleteFamilyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ confirmCode: z.string().trim().toUpperCase() }).parse(input))
  .handler(async ({ data, context }) => {
    const { admin, requireCaretaker } = await import("./admin.server");
    const me = await requireCaretaker(context.userId);
    const { data: fam } = await admin.from("families").select("id, code").eq("id", me.familyId).single();
    if (!fam || fam.code !== data.confirmCode) throw new Error("The Family ID does not match");
    const { data: members } = await admin.from("profiles").select("id").eq("family_id", fam.id);
    for (const folder of ["reports", "prescriptions"]) {
      const { data: files } = await admin.storage.from("family-files").list(`${fam.id}/${folder}`, { limit: 1000 });
      const paths = (files ?? []).map((f) => `${fam.id}/${folder}/${f.name}`);
      if (paths.length) await admin.storage.from("family-files").remove(paths);
    }
    await admin.from("families").delete().eq("id", fam.id);
    for (const m of members ?? []) await admin.auth.admin.deleteUser(m.id);
    return { ok: true };
  });

export const getReportFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ reportId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: report } = await context.supabase.from("reports").select("file_path").eq("id", data.reportId).maybeSingle();
    if (!report) throw new Error("Report not found");
    const { data: signed, error } = await context.supabase.storage.from("family-files").createSignedUrl(report.file_path, 60);
    if (error || !signed) throw new Error("Could not open the file");
    return { url: signed.signedUrl };
  });
