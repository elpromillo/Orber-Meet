import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCalendarClient, CALENDAR_ID, TIMEZONE, getOwnerEmail } from "@/lib/google";

export const runtime = "nodejs";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MEETING_MINUTES_FROM_NOW = 20;
const MEETING_DURATION_MINUTES = 20;

// Rate limit muy simple en memoria (por instancia serverless).
// Suficiente para frenar abuso casual; en producción con tráfico alto
// conviene moverlo a un store compartido (Upstash Redis, etc).
const recentRequests = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (recentRequests.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  recentRequests.set(ip, timestamps);
  return timestamps.length > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
      { status: 429 }
    );
  }

  let body: { name?: string; email?: string; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();

  // Honeypot: campo oculto que un humano nunca llena.
  if (body.company) {
    return NextResponse.json({ error: "Solicitud rechazada." }, { status: 400 });
  }

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
  }

  const start = new Date(Date.now() + MEETING_MINUTES_FROM_NOW * 60 * 1000);
  const end = new Date(start.getTime() + MEETING_DURATION_MINUTES * 60 * 1000);

  try {
    const calendar = getCalendarClient();

    const { data } = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      sendUpdates: "all",
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Orbe Estudio · Llamada con ${name}`,
        description: `Reunión agendada automáticamente desde la landing page por ${name} (${email}).`,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        attendees: [{ email, displayName: name }, { email: getOwnerEmail() }],
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 5 }],
        },
      },
    });

    const meetLink = data.hangoutLink;

    return NextResponse.json({
      ok: true,
      meetLink,
      start: start.toISOString(),
      eventId: data.id,
    });
  } catch (err) {
    console.error("Error creando evento en Google Calendar:", err);
    return NextResponse.json(
      { error: "No se pudo agendar la reunión. Intenta de nuevo en unos minutos." },
      { status: 502 }
    );
  }
}
