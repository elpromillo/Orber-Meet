# Orbe Estudio — Agendamiento automático (Meet en 20 minutos)

Botón "Agendar 20 minutos" que, al hacer clic, pide nombre + correo del visitante y crea
automáticamente un evento en Google Calendar que empieza 20 minutos después, con
videollamada de Google Meet. El visitante recibe la invitación por correo (se suma solo
a su calendario si usa Gmail/Google Calendar) y tú, como organizador, recibes la alerta
en tu calendario y correo.

## 1. Crear las credenciales en Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com/) y crea un proyecto
   (o usa uno existente).
2. **APIs y servicios → Biblioteca** → busca **Google Calendar API** → **Habilitar**.
3. **APIs y servicios → Pantalla de consentimiento OAuth**:
   - Tipo: Externo (si usas Gmail personal) o Interno (si es Workspace).
   - Agrega tu correo como usuario de prueba si queda en modo "Prueba".
4. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación de escritorio**.
   - Copia el **Client ID** y **Client secret**.

## 2. Obtener el refresh token (una sola vez)

```bash
cd "orbe-estudio-web"
npm install
cp .env.example .env.local
```

Abre `.env.local` y pega `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. Luego:

```bash
npm run get-refresh-token
```

Abre la URL que imprime en tu navegador, inicia sesión con la cuenta de Google que
quieres usar para las reuniones y acepta los permisos. El script imprime el
`refresh_token`: pégalo en `.env.local` como `GOOGLE_REFRESH_TOKEN`.

Completa también en `.env.local`:
- `OWNER_EMAIL`: tu correo (recibe la invitación/alerta).
- `TIMEZONE`: tu zona horaria, ej. `America/Bogota`.

## 3. Probar en local

```bash
npm run dev
```

Abre `http://localhost:3000`, haz clic en **Agendar 20 minutos**, completa el
formulario con un correo tuyo de prueba y confirma. Revisa que:
- Te llegue el correo de invitación de Calendar al correo del "visitante".
- Te llegue también a ti (`OWNER_EMAIL`) como organizador.
- El evento aparezca en ambos calendarios con el enlace de Meet.

## 4. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. Impórtalo en [vercel.com](https://vercel.com/new).
3. En **Settings → Environment Variables**, agrega las mismas variables de
   `.env.local` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
   `GOOGLE_CALENDAR_ID`, `OWNER_EMAIL`, `TIMEZONE`).
4. Despliega.

## Notas de seguridad y límites

- El refresh token da acceso solo al scope `calendar.events` (crear/editar eventos),
  no a leer todo tu calendario.
- Hay un límite simple de 3 solicitudes por hora por IP para frenar abuso; con tráfico
  alto conviene moverlo a un store compartido (Upstash Redis, etc.) porque cada
  instancia serverless tiene su propia memoria.
- El formulario incluye un campo honeypot oculto (`company`) como filtro anti-bots
  básico. Si más adelante ves spam, se puede agregar reCAPTCHA/hCaptcha.

## Integrar en la landing final

`components/ScheduleMeetButton.tsx` es un componente independiente: se puede colocar
tal cual dentro del Hero o el Footer de la landing cinematográfica completa (la que
sigue las reglas de `CLAUDE.md`) una vez se elija el preset estético y se construya el
resto del sitio.
