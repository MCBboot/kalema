"use client";
import { useTranslation } from "@/i18n/context";
import { getAllGames } from "@/games/registry";
import { cn } from "@/utils/rtl";
import type { GameRegistration } from "@/games/types";

interface GamePickerProps {
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
  isAdmin: boolean;
}

export default function GamePicker({ selectedGameId, onSelect, isAdmin }: GamePickerProps) {
  const { t } = useTranslation();
  const games = getAllGames();

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">{t("game.noGames")}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-lg font-bold text-center text-foreground-muted">{t("game.select")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isSelected={selectedGameId === game.id}
            onSelect={() => isAdmin && onSelect(game.id)}
            disabled={!isAdmin}
          />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  game,
  isSelected,
  onSelect,
  disabled,
}: {
  game: GameRegistration;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full p-5 rounded-2xl border-2 text-right transition-all duration-300",
        isSelected
          ? "border-accent bg-accent-glow shadow-[0_0_20px_var(--accent-dim)]"
          : "border-border-visible bg-surface hover:border-accent/30 hover:bg-accent-glow",
        disabled ? "cursor-default" : "cursor-pointer active:scale-[0.98]",
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
          isSelected ? "bg-accent/20 text-accent" : "bg-surface-raised text-foreground-muted"
        )}>
          {typeof game.icon === "string" ? game.icon : game.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-bold", isSelected ? "text-accent" : "text-foreground")}>
              {t(game.nameKey)}
            </h3>
            {isSelected && (
              <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                {t("game.selected")}
              </span>
            )}
          </div>
          <p className="text-xs text-foreground-muted mt-1 line-clamp-2">{t(game.descriptionKey)}</p>
          <p className="text-[10px] text-foreground-dim mt-2">
            {t("room.minPlayers", { min: game.minPlayers })}
          </p>
        </div>
      </div>
    </button>
  );
}
