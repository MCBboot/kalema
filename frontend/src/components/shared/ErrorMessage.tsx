"use client";

export const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: "الغرفة غير موجودة",
  DUPLICATE_NAME: "اسم مستخدم مكرر",
  UNAUTHORIZED: "غير مسموح",
  INVALID_PHASE: "المرحلة غير صحيحة",
  INSUFFICIENT_PLAYERS: "عدد اللاعبين غير كافي",
  NO_WORDS: "لا توجد كلمات",
  INVALID_NAME: "الاسم غير صالح",
  NAME_TOO_LONG: "الاسم طويل جداً",
  INVALID_WORD: "الكلمة غير صالحة",
  DUPLICATE_WORD: "الكلمة مكررة",
  INVALID_TARGET: "الهدف غير صالح",
  ALREADY_VOTED: "تم التصويت مسبقاً",
  TOKEN_EXPIRED: "انتهت صلاحية الجلسة",
  INVALID_TOKEN: "رمز الجلسة غير صالح",
  PLAYER_NOT_FOUND: "اللاعب غير موجود",
  NO_ACTIVE_GAME: "لا توجد لعبة نشطة",
  CANNOT_KICK_ADMIN: "لا يمكن طرد المشرف",
  CANNOT_VOTE_SELF: "لا يمكنك التصويت لنفسك",
  NOT_ELIGIBLE: "غير مؤهل للتصويت",
  PLAYER_NOT_OFFLINE: "اللاعب ليس غير متصل",
  ROOM_LOCKED: "الغرفة مقفلة، لا يمكن الانضمام الآن",
  INVALID_PHASE_TRANSITION: "انتقال مرحلة غير صالح",
  INVALID_VALUE: "قيمة غير صالحة",
  MISSING_FIELD: "حقل مطلوب مفقود",
};

interface ErrorMessageProps {
  code: string;
}

export default function ErrorMessage({ code }: ErrorMessageProps) {
  const message = ERROR_MESSAGES[code] || "حدث خطأ غير متوقع";

  return (
    <div className="w-full rounded-2xl bg-danger-surface border border-danger/20 px-5 py-4 text-danger text-sm font-semibold flex items-center gap-2 animate-shake">
      <span className="text-base flex-shrink-0">{"\u26A0"}</span>
      <span>{message}</span>
    </div>
  );
}
