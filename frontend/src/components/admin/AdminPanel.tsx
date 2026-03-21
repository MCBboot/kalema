"use client";
import { usePlayer } from "@/store/playerStore";
import PlayerManagement from "@/components/admin/PlayerManagement";
import WordPanel from "@/components/admin/WordPanel";

export default function AdminPanel() {
  const { isAdmin } = usePlayer();

  if (!isAdmin) return null;

  return (
    <div className="w-full bg-foreground/5 rounded-2xl p-4 space-y-6">
      <h2 className="text-lg font-semibold">لوحة التحكم</h2>
      <PlayerManagement />
      <WordPanel />
    </div>
  );
}
