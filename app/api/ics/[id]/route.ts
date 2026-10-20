import { getAnalysis } from "@/lib/store";

/** Escapes text for an iCalendar field. */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Returns an .ics calendar event for the report deadline, with a reminder 2 days before. */
export async function GET(_req: Request, ctx: RouteContext<"/api/ics/[id]">) {
  const { id } = await ctx.params;
  const record = await getAnalysis(id);
  const date = record?.analysis?.deadline?.date;
  if (!record || !date) return new Response("Not found", { status: 404 });

  const day = date.replace(/-/g, "");
  const a = record.analysis!;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lamurit//RO",
    "BEGIN:VEVENT",
    `UID:${id}@lamurit`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${esc(`Termen: ${a.docType} (${a.issuer})`)}`,
    `DESCRIPTION:${esc(`${a.deadline?.description ?? ""}\n\n${a.steps.join("\n")}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P2D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Peste 2 zile: ${a.docType}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="termen-lamurit.ics"`,
    },
  });
}
