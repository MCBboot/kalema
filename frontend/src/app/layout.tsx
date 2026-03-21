import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ConnectionProvider } from "@/store/connectionStore";
import { RoomProvider } from "@/store/roomStore";
import { PlayerProvider } from "@/store/playerStore";
import { SecretProvider } from "@/store/secretStore";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "كلمة - لعبة المحتال",
  description: "لعبة المحتال العربية في الوقت الحقيقي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${notoSansArabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ConnectionProvider>
          <RoomProvider>
            <PlayerProvider>
              <SecretProvider>
                {children}
              </SecretProvider>
            </PlayerProvider>
          </RoomProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
