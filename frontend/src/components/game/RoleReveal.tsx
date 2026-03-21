"use client";
import { useSecret } from "@/store/secretStore";

export default function RoleReveal() {
  const { role, word } = useSecret();

  if (role === null) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="bg-foreground/5 border border-foreground/20 rounded-2xl p-8 text-center">
          <p className="text-lg text-foreground/50">في انتظار بدء الجولة</p>
        </div>
      </div>
    );
  }

  if (role === "impostor") {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-8 text-center w-full max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl font-bold">؟</span>
          </div>
          <p className="text-3xl font-bold text-red-400">!انت المحتال</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-12">
      <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-8 text-center w-full max-w-sm">
        <p className="text-lg text-foreground/60 mb-3">:كلمتك هي</p>
        <p className="text-5xl font-bold text-primary">{word}</p>
      </div>
    </div>
  );
}
