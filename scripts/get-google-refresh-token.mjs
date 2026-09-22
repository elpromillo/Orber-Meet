// Script de un solo uso: obtiene el GOOGLE_REFRESH_TOKEN necesario para que
// la API pueda crear eventos en tu Google Calendar sin que vuelvas a iniciar sesión.
//
// Uso:
//   1. Copia .env.example a .env.local y completa GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
//      (ver README.md para crear el cliente OAuth en Google Cloud Console).
//   2. npm run get-refresh-token
//   3. Abre en tu navegador la URL que imprime, inicia sesión con la cuenta de Google
//      que quieres usar para agendar, y acepta los permisos.
//   4. El script imprime el refresh token: pégalo en .env.local como GOOGLE_REFRESH_TOKEN.

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { google } from "googleapis";

function loadEnvLocal() {
  const path = new URL("../.env.local", import.meta.url);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    "Falta GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en .env.local. Revisa el README.md."
  );
  process.exit(1);
}

const server = createServer();
server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  const redirectUri = `http://127.0.0.1:${port}`;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });

  console.log("\nAbre esta URL en tu navegador e inicia sesión con la cuenta de Google");
  console.log("que quieres usar para crear las reuniones:\n");
  console.log(authUrl + "\n");
  console.log("Esperando la autorización...\n");

  server.on("request", async (req, res) => {
    const url = new URL(req.url, redirectUri);
    const code = url.searchParams.get("code");

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("No se recibió código de autorización.");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<html><body style='font-family: sans-serif; padding: 40px;'>" +
          "<h2>Listo ✅</h2><p>Ya puedes cerrar esta pestaña y volver a la terminal.</p></body></html>"
      );

      console.log("Refresh token obtenido:\n");
      console.log(tokens.refresh_token);
      console.log("\nPégalo en .env.local como GOOGLE_REFRESH_TOKEN=<ese valor>\n");

      if (!tokens.refresh_token) {
        console.warn(
          "Aviso: Google no devolvió refresh_token (puede pasar si ya habías autorizado antes)."
        );
        console.warn(
          "Ve a https://myaccount.google.com/permissions, quita el acceso de esta app y vuelve a correr el script."
        );
      }
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Error intercambiando el código. Revisa la terminal.");
      console.error("Error obteniendo el token:", err.message);
    } finally {
      server.close();
      process.exit(0);
    }
  });
});
