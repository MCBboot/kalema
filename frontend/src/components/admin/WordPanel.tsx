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

  const wordCount = room?.words.length ?? 0;

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
    <div>
      <h3 className="text-md font-semibold mb-3">الكلمات</h3>

      <p className="text-sm text-foreground/60 mb-3">
        عدد الكلمات: {wordCount}
      </p>

      <div className="flex items-end gap-2 mb-3">
        <Input
          value={word}
          onChange={setWord}
          placeholder="كلمة جديدة"
          className="flex-1"
        />
        <Button
          onClick={handleAddWord}
          disabled={!word.trim()}
          className="w-auto px-6 flex-shrink-0"
        >
          إضافة
        </Button>
      </div>

      {success && (
        <div className="w-full rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-400 text-sm mb-3">
          تمت الإضافة
        </div>
      )}

      {error && (
        <div className="mb-3">
          <ErrorMessage code={error} />
        </div>
      )}
    </div>
  );
}
