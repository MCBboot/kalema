"use client";
import { cn } from "@/utils/rtl";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-background font-bold hover:bg-accent-hover hover:shadow-[0_0_24px_var(--accent-dim)] active:scale-[0.97]",
  secondary:
    "border border-border-visible text-foreground hover:border-accent/40 hover:text-accent hover:bg-accent-glow active:scale-[0.97]",
  danger:
    "bg-danger/90 text-white font-bold hover:bg-danger hover:shadow-[0_0_24px_var(--danger-dim)] active:scale-[0.97]",
};

export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  className,
  type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold transition-all duration-300 cursor-pointer",
        variantClasses[variant],
        isDisabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
