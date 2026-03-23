"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/store/themeStore";
import { usePlayer } from "@/store/playerStore";
import { useRoom } from "@/store/roomStore";
import { useSocketEmit } from "@/hooks/useSocketEvents";
import { ClientEvents } from "@/lib/api-types";

const themeOptions = [
  { value: "auto" as const, label: "تلقائي", icon: "◐" },
  { value: "dark" as const, label: "داكن", icon: "●" },
  { value: "light" as const, label: "فاتح", icon: "○" },
];

export default function Menu() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const { savedDisplayName, setSavedDisplayName, isAdmin } = usePlayer();
  const { room } = useRoom();
  const emit = useSocketEmit();

  const status = room?.status;
  const isGameActive = status === "PLAYING";
  const isLocked = status === "LOCKED";
  const inRoom = !!room;

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  function handleFullReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("kalema")) {
        localStorage.removeItem(key);
      }
    }
    window.location.href = "/";
  }

  function handleExitToChoosing() {
    if (!window.confirm("هل تريد إيقاف اللعبة والرجوع لاختيار اللعبة؟")) return;
    emit(ClientEvents.STOP_GAME);
    setOpen(false);
  }

  function handleBackToWaiting() {
    emit(ClientEvents.UNLOCK_ROOM);
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="fixed top-4 left-4 z-50">
      {/* Hamburger button */}
      <button
        onClick={() => { setOpen(!open); setConfirmReset(false); }}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border-visible text-foreground-muted transition-all duration-200 hover:text-accent hover:border-accent/30"
        aria-label="القائمة"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {open ? (
            <>
              <line x1="4" y1="4" x2="14" y2="14" />
              <line x1="14" y1="4" x2="4" y2="14" />
            </>
          ) : (
            <>
              <line x1="3" y1="5" x2="15" y2="5" />
              <line x1="3" y1="9" x2="15" y2="9" />
              <line x1="3" y1="13" x2="15" y2="13" />
            </>
          )}
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-12 left-0 w-56 rounded-2xl bg-surface-raised border border-border-visible shadow-xl shadow-black/30 overflow-hidden animate-fade-up">
          {/* Account section */}
          {savedDisplayName && (
            <div className="p-3 border-b border-border-visible">
              <p className="text-xs text-foreground-muted mb-2 px-1">الحساب</p>
              {editingName ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (nameInput.trim()) {
                      setSavedDisplayName(nameInput.trim());
                      setEditingName(false);
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={20}
                    autoComplete="off"
                    className="flex-1 bg-surface border border-border-visible rounded-xl h-9 px-3 text-right text-sm text-foreground placeholder:text-foreground-dim focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all"
                    placeholder="اسم جديد"
                  />
                  <button
                    type="submit"
                    disabled={!nameInput.trim()}
                    className="h-9 px-3 rounded-xl bg-accent text-background text-xs font-bold disabled:opacity-40 transition-all"
                  >
                    حفظ
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={() => {
                      setNameInput(savedDisplayName);
                      setEditingName(true);
                      setTimeout(() => nameInputRef.current?.focus(), 50);
                    }}
                    className="text-[11px] text-foreground-dim hover:text-accent transition-colors"
                  >
                    تغيير
                  </button>
                  <span className="text-sm font-bold text-accent">{savedDisplayName}</span>
                </div>
              )}
            </div>
          )}

          {/* Game navigation — admin only, in room */}
          {inRoom && isAdmin && (isGameActive || isLocked) && (
            <div className="p-2 border-b border-border-visible">
              <p className="text-xs text-foreground-muted mb-1 px-1">اللعبة</p>

              {/* During active game: exit to game selection */}
              {isGameActive && (
                <button
                  onClick={handleExitToChoosing}
                  className="w-full text-right px-3 py-2.5 rounded-xl text-sm text-danger transition-all duration-200 hover:bg-danger/10"
                >
                  إيقاف والرجوع لاختيار اللعبة
                </button>
              )}

              {/* During choosing: back to waiting room */}
              {isLocked && (
                <button
                  onClick={handleBackToWaiting}
                  className="w-full text-right px-3 py-2.5 rounded-xl text-sm text-foreground-muted transition-all duration-200 hover:bg-surface-overlay hover:text-foreground"
                >
                  رجوع لغرفة الانتظار
                </button>
              )}
            </div>
          )}

          {/* Theme section */}
          <div className="p-3 border-b border-border-visible">
            <p className="text-xs text-foreground-muted mb-2 px-1">المظهر</p>
            <div className="flex gap-1">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all duration-200 ${
                    theme === opt.value
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-foreground-muted hover:bg-surface-overlay border border-transparent"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleFullReset}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                confirmReset
                  ? "bg-danger/15 text-danger"
                  : "text-foreground-muted hover:bg-surface-overlay hover:text-foreground"
              }`}
            >
              {confirmReset ? "اضغط مرة أخرى للتأكيد" : "إعادة تعيين كاملة"}
            </button>

            <a
              href="/"
              className="block w-full text-right px-3 py-2.5 rounded-xl text-sm text-foreground-muted transition-all duration-200 hover:bg-surface-overlay hover:text-foreground"
            >
              الصفحة الرئيسية
            </a>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border-visible">
            <p className="text-[10px] text-foreground-dim">كلمة v1.0</p>
          </div>
        </div>
      )}
    </div>
  );
}
