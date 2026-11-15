import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { runReminderTick } = await import("@/lib/reminders.server");
        try {
          const stats = await runReminderTick();
          return Response.json({ ok: true, stats });
        } catch (error) {
          console.error("reminder tick failed", error instanceof Error ? error.message : "unknown");
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
