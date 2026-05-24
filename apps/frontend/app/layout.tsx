import type { Metadata } from "next";
import { InteractiveBackground } from "./components/InteractiveBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "MinerGuard",
  description: "Dashboard de monitoreo minero en tiempo real"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <InteractiveBackground />
        {children}
      </body>
    </html>
  );
}
