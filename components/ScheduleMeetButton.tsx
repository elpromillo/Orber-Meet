"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ScheduleMeetButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [meetLink, setMeetLink] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const company = (form.elements.namedItem("company") as HTMLInputElement).value;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/schedule-meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Algo salió mal.");
      }

      setMeetLink(data.meetLink);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Algo salió mal.");
      setStatus("error");
    }
  }

  function close() {
    setIsOpen(false);
    setStatus("idle");
    setErrorMessage("");
    setMeetLink(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative overflow-hidden rounded-[2.5rem] bg-[#1A1A1A] px-8 py-4 text-sm font-medium tracking-wide text-white transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-[0.98]"
      >
        <span className="relative z-10">Agendar 20 minutos</span>
        <span className="absolute inset-0 -translate-x-full bg-[#CC5833] transition-transform duration-300 ease-out group-hover:translate-x-0" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-[2.5rem] bg-[#F2F0E9] p-8 text-[#1A1A1A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {status === "success" ? (
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-semibold">Listo ✅</h3>
                <p className="text-sm text-[#1A1A1A]/70">
                  Te enviamos la invitación por correo. Nos vemos en 20 minutos por Google
                  Meet.
                </p>
                {meetLink && (
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-full bg-[#1A1A1A] px-6 py-3 text-sm text-white transition hover:scale-[1.03]"
                  >
                    Abrir enlace de Meet
                  </a>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="block w-full text-xs text-[#1A1A1A]/50 underline"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-2xl font-semibold">Agenda tu llamada</h3>
                  <p className="mt-1 text-sm text-[#1A1A1A]/70">
                    Te escribimos por Meet en los próximos 20 minutos.
                  </p>
                </div>

                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Tu nombre"
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#CC5833]"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  className="w-full rounded-2xl border border-[#1A1A1A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#CC5833]"
                />
                {/* Honeypot anti-spam: oculto para humanos */}
                <input
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {status === "error" && (
                  <p className="text-sm text-[#CC5833]">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-full bg-[#1A1A1A] px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {status === "loading" ? "Agendando..." : "Confirmar"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="block w-full text-center text-xs text-[#1A1A1A]/50 underline"
                >
                  Cancelar
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
