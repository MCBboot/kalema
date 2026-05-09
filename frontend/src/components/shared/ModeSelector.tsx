import { useTranslation } from "@/i18n/context";

interface ModeSelectorProps {
  mode: "ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT";
  setMode: (mode: "ONLINE" | "LOCAL_HOST" | "LOCAL_CLIENT") => void;
}

export default function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex bg-surface-raised p-1 rounded-xl mb-4 w-full">
      <button
        onClick={() => setMode("ONLINE")}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
          mode === "ONLINE"
            ? "bg-accent text-background shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        أونلاين (Online)
      </button>
      <button
        onClick={() => setMode("LOCAL_HOST")}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
          mode === "LOCAL_HOST" || mode === "LOCAL_CLIENT"
            ? "bg-accent text-background shadow-sm"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        شبكة محلية (Local)
      </button>
    </div>
  );
}
