"use client";
import { useState, useCallback } from "react";
import { useTranslation } from "@/i18n/context";

interface RoomCodeProps {
  code: string;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
}

export default function RoomCode({ code }: RoomCodeProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const getShareUrl = useCallback(() => {
    return `${window.location.origin}/join?code=${code}`;
  }, [code]);

  const handleCopyCode = useCallback(async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleCopyLink = useCallback(async () => {
    await copyToClipboard(getShareUrl());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [getShareUrl]);

  const handleShare = useCallback(async () => {
    const url = getShareUrl();
    const shareData = {
      title: t("room.shareTitle"),
      text: t("room.shareText", { code }),
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled — fall through to copy
      }
    }

    // Fallback: copy link
    await handleCopyLink();
  }, [getShareUrl, handleCopyLink, t, code]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] sm:text-xs text-foreground-muted tracking-wider">{t("room.code")}</span>
      <button
        onClick={handleCopyCode}
        className="group flex items-center gap-2 sm:gap-3 card px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 hover:border-accent/30 cursor-pointer active:scale-[0.97]"
      >
        <span
          dir="ltr"
          className="text-2xl sm:text-3xl font-bold tracking-[0.3em] sm:tracking-[0.4em] text-accent select-all"
        >
          {code}
        </span>
        <span className="text-[9px] sm:text-xs text-foreground-dim group-hover:text-accent transition-colors border border-border-visible group-hover:border-accent/30 rounded-md sm:rounded-lg px-2 py-0.5 sm:py-1">
          {copied ? t("room.copied") : t("room.code")}
        </span>
      </button>

      {/* Action buttons: copy link + share */}
      <div className="flex items-center gap-4 mt-1">
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 text-[10px] sm:text-xs text-foreground-dim hover:text-accent transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {linkCopied ? t("room.copied") : t("room.copyLink")}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[10px] sm:text-xs text-foreground-dim hover:text-accent transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {t("room.share")}
        </button>
      </div>
    </div>
  );
}
