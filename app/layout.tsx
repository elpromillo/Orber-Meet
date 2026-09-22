import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbe Estudio",
  description: "Agenda una llamada con Orbe Estudio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
