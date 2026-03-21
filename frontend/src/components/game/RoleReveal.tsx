"use client";
import { useSecret } from "@/store/secretStore";

export default function RoleReveal() {
  const { role, word } = useSecret();

  if (role === null) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="card-raised p-10 text-center animate-fade-up">
          <p className="text-lg text-foreground-muted">في انتظار بدء الجولة</p>
        </div>
      </div>
    );
  }

  if (role === "impostor") {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="relative bg-danger-surface border-2 border-danger/30 rounded-2xl p-10 text-center w-full max-w-sm animate-fade-up pulse-danger">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center">
            <span className="text-danger text-3xl font-bold">؟</span>
          </div>
          <p className="text-4xl font-bold text-danger">!انت المحتال</p>
          <p className="text-danger/60 mt-3 text-sm">لا أحد يعرف... بعد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-16">
      <div className="relative bg-surface border-2 border-accent/20 rounded-2xl p-10 text-center w-full max-w-sm animate-fade-up glow-accent">
        <p className="text-sm text-foreground-muted mb-4 tracking-wide">كلمتك هي</p>
        <div className="h-px w-12 mx-auto mb-5 bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
        <p className="text-5xl font-bold text-accent leading-tight">{word}</p>
      </div>
    </div>
  );
}
