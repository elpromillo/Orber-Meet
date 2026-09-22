import ScheduleMeetButton from "@/components/ScheduleMeetButton";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#F2F0E9] px-6 text-center">
      <h1 className="text-4xl font-semibold text-[#1A1A1A]">Orbe Estudio</h1>
      <p className="max-w-md text-[#1A1A1A]/70">
        Demo del botón de agendamiento automático. Al hacer clic se crea una reunión de
        Google Meet en 20 minutos, se invita al visitante por correo y tú recibes la
        alerta en tu calendario.
      </p>
      <ScheduleMeetButton />
    </main>
  );
}
