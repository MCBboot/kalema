"use client";
import { useState, useCallback, useEffect } from "react";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useRoom } from "@/store/roomStore";
import { useSocketEvent, useSocketEmit } from "@/hooks/useSocketEvents";
import {
  ClientEvents,
  ServerEvents,
  type ActionRejectedPayload,
} from "@/lib/api-types";

export default function WordPanel() {
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { room } = useRoom();
  const emit = useSocketEmit();

  const wordCount = room?.words?.length ?? 0;

  useSocketEvent(ServerEvents.WORD_ADDED, () => {
    setSuccess(true);
    setWord("");
    setError(null);
  });

  useSocketEvent<ActionRejectedPayload>(ServerEvents.ACTION_REJECTED, (data) => {
    setError(data.code);
    setSuccess(false);
  });

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleAddWord = useCallback(() => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setError(null);
    setSuccess(false);
    emit(ClientEvents.ADD_WORD, { word: trimmed });
  }, [word, emit]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] sm:text-xs font-bold text-foreground-muted tracking-wide uppercase">الكلمات</h3>
        <span className="text-[10px] sm:text-xs text-foreground-dim">
          <span className="font-mono text-accent">{wordCount}</span> كلمة
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={word}
          onChange={setWord}
          placeholder="كلمة جديدة"
          className="flex-1"
        />
        <Button
          onClick={handleAddWord}
          disabled={!word.trim()}
          className="w-full sm:w-auto sm:px-6 flex-shrink-0"
        >
          إضافة
        </Button>
      </div>

      {success && (
        <div className="w-full rounded-xl sm:rounded-2xl bg-success-surface border border-success/20 px-3 py-2.5 text-success text-xs sm:text-sm">
          تمت الإضافة
        </div>
      )}

      {error && <ErrorMessage code={error} />}
    </div>
  );
}
