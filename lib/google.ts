import { google } from "googleapis";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    getEnv("GOOGLE_CLIENT_ID"),
    getEnv("GOOGLE_CLIENT_SECRET")
  );

  oauth2Client.setCredentials({
    refresh_token: getEnv("GOOGLE_REFRESH_TOKEN"),
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
export const TIMEZONE = process.env.TIMEZONE || "America/Bogota";

export function getOwnerEmail(): string {
  return getEnv("OWNER_EMAIL");
}
