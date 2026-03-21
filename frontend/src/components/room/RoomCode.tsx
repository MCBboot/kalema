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
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] sm:text-xs text-foreground-muted tracking-wider">رمز الغرفة</span>
      <button
        onClick={handleCopy}
        className="group flex items-center gap-2 sm:gap-3 card px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 hover:border-accent/30 cursor-pointer active:scale-[0.97]"
      >
        <span
          dir="ltr"
          className="text-2xl sm:text-3xl font-bold tracking-[0.3em] sm:tracking-[0.4em] text-accent select-all"
        >
          {code}
        </span>
        <span className="text-[9px] sm:text-xs text-foreground-dim group-hover:text-accent transition-colors border border-border-visible group-hover:border-accent/30 rounded-md sm:rounded-lg px-2 py-0.5 sm:py-1">
          {copied ? "تم" : "نسخ"}
        </span>
      </button>
    </div>
  );
}
