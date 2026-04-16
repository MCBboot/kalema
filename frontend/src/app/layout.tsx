import type { Metadata } from "next";
import "./globals.css";
import { ConnectionProvider } from "@/store/connectionStore";
import { RoomProvider } from "@/store/roomStore";
import { PlayerProvider } from "@/store/playerStore";
import { ToastProvider } from "@/components/shared/Toast";
import { ThemeProvider } from "@/store/themeStore";
import { I18nProvider } from "@/i18n/context";
import Menu from "@/components/shared/Menu";
import { GameInit } from "./game-init";

export const metadata: Metadata = {
  title: "كلمة — Kalema",
  description: "ألعاب جماعية في الوقت الحقيقي — Real-time party games",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <ConnectionProvider>
                <RoomProvider>
                  <PlayerProvider>
                    <GameInit />
                    <Menu />
                    {children}
                  </PlayerProvider>
                </RoomProvider>
              </ConnectionProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
