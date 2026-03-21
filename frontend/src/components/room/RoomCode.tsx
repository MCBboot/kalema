"use client";
import { useState, useCallback } from "react";

interface RoomCodeProps {
  code: string;
}

export default function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <span className="text-sm text-foreground/60">رمز الغرفة</span>
      <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/20 rounded-xl px-6 py-4">
        <span
          dir="ltr"
          className="text-4xl font-bold tracking-[0.3em] text-primary select-all"
        >
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="text-sm text-foreground/50 hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-foreground/20 hover:border-foreground/40"
        >
          {copied ? "تم النسخ" : "نسخ"}
        </button>
      </div>
    </div>
  );
}
