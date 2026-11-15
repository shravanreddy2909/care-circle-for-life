// Server-only email sending through Resend, with idempotent logging and dry-run mode.
import { admin } from "./admin.server";

export type EmailJob = {
  familyId: string;
  to: string;
  subject: string;
  lines: string[];
  kind: string;
  dedupeKey: string;
  dryRun: boolean;
  enabled: boolean;
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderHtml(subject: string, lines: string[]) {
  const body = lines.map((l) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#2a1a1c">${escapeHtml(l)}</p>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:28px 24px">
<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;color:#5C0F1F">CareCircle</p>
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:20px;color:#8B1A2B">${escapeHtml(subject)}</h1>
${body}
<p style="margin:24px 0 0;font-size:12px;color:#6b5a5c">This app supports care but is not a substitute for medical advice.</p>
</div></body></html>`;
}

/** Returns "sent" | "dry_run" | "skipped" | "failed" | "duplicate". Never logs message content. */
export async function sendEmail(job: EmailJob) {
  const { data: row, error } = await admin
    .from("notification_log")
    .insert({ family_id: job.familyId, recipient: job.to, kind: job.kind, subject: job.subject, status: "pending", dedupe_key: job.dedupeKey })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return "duplicate" as const;
    console.error("notification log insert failed", error.code);
    return "failed" as const;
  }
  const finish = (status: "sent" | "dry_run" | "skipped" | "failed", err: string | null = null) =>
    admin.from("notification_log").update({ status, error: err }).eq("id", row.id);

  if (!job.enabled) {
    await finish("skipped", "Email reminders are turned off");
    return "skipped" as const;
  }
  const apiKey = process.env["RESEND_API_KEY"];
  if (job.dryRun || !apiKey) {
    await finish("dry_run", job.dryRun ? null : "Email key not added yet — logged only");
    return "dry_run" as const;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": job.dedupeKey.slice(0, 250),
      },
      body: JSON.stringify({
        from: process.env["RESEND_FROM_EMAIL"] || "CareCircle <onboarding@resend.dev>",
        to: [job.to],
        subject: job.subject,
        text: [...job.lines, "", "This app supports care but is not a substitute for medical advice."].join("\n"),
        html: renderHtml(job.subject, job.lines),
      }),
    });
    if (!res.ok) {
      await finish("failed", `Email service returned ${res.status}`);
      return "failed" as const;
    }
    await finish("sent");
    return "sent" as const;
  } catch {
    await finish("failed", "Could not reach the email service");
    return "failed" as const;
  }
}
