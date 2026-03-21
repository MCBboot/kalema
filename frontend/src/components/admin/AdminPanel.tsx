"use client";
import { usePlayer } from "@/store/playerStore";
import PlayerManagement from "@/components/admin/PlayerManagement";
import WordPanel from "@/components/admin/WordPanel";

export default function AdminPanel() {
  const { isAdmin } = usePlayer();

  if (!isAdmin) return null;

  return (
    <div className="w-full card-raised p-4 sm:p-5 space-y-5 sm:space-y-6">
      <div>
        <h2 className="text-xs sm:text-sm font-bold text-accent tracking-wide">لوحة التحكم</h2>
        <div className="h-px w-10 mt-2 bg-accent/30" />
      </div>
      <PlayerManagement />
      <div className="h-px bg-border" />
      <WordPanel />
    </div>
  );
}
