import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLA by Randstad",
  description: "Portal de Gestión",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}