// The every-minute reminder and escalation job. Idempotent: every step "claims" a row
// with a conditional update before emailing, and every email has a unique dedupe key.
import { admin, audit } from "./admin.server";
import { sendEmail } from "./email.server";

type Family = {
  id: string; timezone: string; pre_reminder_minutes: number; second_reminder_minutes: number;
  missed_after_minutes: number; email_enabled: boolean; email_dry_run: boolean;
};
type Person = { id: string; family_id: string | null; full_name: string; email: string | null; role: string };

const MIN = 60_000;

function timeIn(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso)).toUpperCase();
}
function dateTimeIn(iso: string, tz: string) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso));
}

export async function runReminderTick(nowMs = Date.now()) {
  const stats = { pre: 0, due: 0, second: 0, missed: 0, appointments: 0, expired: 0 };
  await admin.rpc("generate_all_doses");

  const { data: families } = await admin
    .from("families")
    .select("id, timezone, pre_reminder_minutes, second_reminder_minutes, missed_after_minutes, email_enabled, email_dry_run");
  const famMap = new Map<string, Family>((families ?? []).map((f) => [f.id, f]));
  if (!famMap.size) return stats;

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    admin.from("profiles").select("id, family_id, full_name, email").not("family_id", "is", null),
    admin.from("user_roles").select("user_id, role"),
  ]);
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
  const people: Person[] = (profiles ?? [])
    .filter((p) => roleMap.has(p.id))
    .map((p) => ({ ...p, role: roleMap.get(p.id)! }));
  const byId = new Map(people.map((p) => [p.id, p]));
  const caretakersOf = (familyId: string) => people.filter((p) => p.family_id === familyId && p.role === "caretaker");

  // Silently close doses that are far past due (e.g. after downtime) without emailing.
  const { count: expired } = await admin
    .from("doses")
    .update({ status: "missed" }, { count: "exact" })
    .eq("status", "upcoming")
    .lt("scheduled_at", new Date(nowMs - 3 * 60 * MIN).toISOString());
  stats.expired = expired ?? 0;

  const { data: doses } = await admin
    .from("doses")
    .select("id, family_id, elder_id, medicine_name, dose, scheduled_at, pre_reminder_sent_at, due_reminder_sent_at, second_reminder_sent_at")
    .eq("status", "upcoming")
    .gte("scheduled_at", new Date(nowMs - 3 * 60 * MIN).toISOString())
    .lte("scheduled_at", new Date(nowMs + 125 * MIN).toISOString());

  const nowIso = new Date(nowMs).toISOString();

  for (const dose of doses ?? []) {
    const fam = famMap.get(dose.family_id);
    if (!fam) continue;
    const elder = byId.get(dose.elder_id);
    const due = new Date(dose.scheduled_at).getTime();
    const at = timeIn(dose.scheduled_at, fam.timezone);
    const tablet = `${dose.medicine_name} ${dose.dose}`;
    const elderEmail = (kind: string, subject: string, lines: string[]) =>
      elder?.email
        ? sendEmail({ familyId: fam.id, to: elder.email, subject, lines, kind, dedupeKey: `${kind}:${dose.id}`, dryRun: fam.email_dry_run, enabled: fam.email_enabled })
        : Promise.resolve("skipped");

    if (nowMs >= due + fam.missed_after_minutes * MIN) {
      const { data: claimed } = await admin
        .from("doses")
        .update({ status: "missed", missed_alert_sent_at: nowIso })
        .eq("id", dose.id).eq("status", "upcoming")
        .select("id");
      if (!claimed?.length) continue;
      stats.missed++;
      const name = elder?.full_name || "Your elder";
      const message = `${name} has not taken ${tablet} (due ${at}). Please call them.`;
      await admin.from("alerts").insert({ family_id: fam.id, elder_id: dose.elder_id, dose_id: dose.id, kind: "missed_dose", message });
      await audit(fam.id, null, "dose.missed", { medicine: dose.medicine_name, dose: dose.dose, scheduled_at: dose.scheduled_at });
      for (const c of caretakersOf(fam.id)) {
        if (!c.email) continue;
        await sendEmail({
          familyId: fam.id, to: c.email, subject: `Missed tablet: ${name}`, lines: [message],
          kind: "missed_alert", dedupeKey: `missed:${dose.id}:${c.id}`, dryRun: fam.email_dry_run, enabled: fam.email_enabled,
        });
      }
      continue;
    }

    if (nowMs >= due + fam.second_reminder_minutes * MIN && !dose.second_reminder_sent_at) {
      const { data: claimed } = await admin.from("doses").update({ second_reminder_sent_at: nowIso })
        .eq("id", dose.id).eq("status", "upcoming").is("second_reminder_sent_at", null).select("id");
      if (claimed?.length) {
        stats.second++;
        await elderEmail("second_reminder", `Reminder: ${tablet}`, [`Gentle reminder: please take ${tablet} (due ${at}).`, `Open CareCircle and press "I have taken it".`]);
      }
      continue;
    }

    if (nowMs >= due && !dose.due_reminder_sent_at && !dose.second_reminder_sent_at) {
      const { data: claimed } = await admin.from("doses").update({ due_reminder_sent_at: nowIso })
        .eq("id", dose.id).eq("status", "upcoming").is("due_reminder_sent_at", null).select("id");
      if (claimed?.length) {
        stats.due++;
        await elderEmail("due_reminder", `Time for your tablet: ${tablet}`, [`Time for your tablet: ${tablet} (${at}).`, `Open CareCircle and press "I have taken it".`]);
      }
      continue;
    }

    if (nowMs < due && nowMs >= due - fam.pre_reminder_minutes * MIN && !dose.pre_reminder_sent_at) {
      const { data: claimed } = await admin.from("doses").update({ pre_reminder_sent_at: nowIso })
        .eq("id", dose.id).eq("status", "upcoming").is("pre_reminder_sent_at", null).select("id");
      if (claimed?.length) {
        stats.pre++;
        await elderEmail("pre_reminder", `Coming up at ${at}: ${tablet}`, [`Your tablet ${tablet} is due at ${at}.`]);
      }
    }
  }

  // Appointment reminders: a day before and 3 hours before.
  const { data: appts } = await admin
    .from("appointments")
    .select("id, family_id, elder_id, title, location, scheduled_at, day_before_sent_at, hours_before_sent_at")
    .gt("scheduled_at", nowIso)
    .lte("scheduled_at", new Date(nowMs + 25 * 60 * MIN).toISOString());
  for (const a of appts ?? []) {
    const fam = famMap.get(a.family_id);
    if (!fam) continue;
    const t = new Date(a.scheduled_at).getTime();
    let kind: "appt_hours" | "appt_day" | null = null;
    if (nowMs >= t - 3 * 60 * MIN && !a.hours_before_sent_at) kind = "appt_hours";
    else if (nowMs >= t - 24 * 60 * MIN && nowMs < t - 3 * 60 * MIN && !a.day_before_sent_at) kind = "appt_day";
    if (!kind) continue;
    const column = kind === "appt_hours" ? "hours_before_sent_at" : "day_before_sent_at";
    const { data: claimed } = await admin.from("appointments").update({ [column]: nowIso })
      .eq("id", a.id).is(column, null).select("id");
    if (!claimed?.length) continue;
    stats.appointments++;
    const elder = byId.get(a.elder_id);
    const when = dateTimeIn(a.scheduled_at, fam.timezone);
    const lines = [`Reminder: ${elder?.full_name ? `${elder.full_name}'s` : "an"} appointment — ${a.title}, ${when}.`, ...(a.location ? [`Where: ${a.location}`] : [])];
    const recipients = [elder, ...caretakersOf(fam.id)].filter((p): p is Person => !!p?.email);
    for (const r of recipients) {
      await sendEmail({
        familyId: fam.id, to: r.email!, subject: `Appointment ${kind === "appt_day" ? "tomorrow" : "today"}: ${a.title}`,
        lines, kind, dedupeKey: `${kind}:${a.id}:${r.id}`, dryRun: fam.email_dry_run, enabled: fam.email_enabled,
      });
    }
  }

  return stats;
}
