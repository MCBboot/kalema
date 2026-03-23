"use client";
import { useState, useEffect } from "react";
import { cn } from "@/utils/rtl";

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  type?: string;
  className?: string;
}

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  maxLength,
  type = "text",
  className,
}: InputProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-foreground-muted mb-1.5 sm:mb-2">
          {label}
        </label>
      )}
      {mounted ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete="off"
          data-form-type="other"
          className={cn(
            "w-full bg-surface-raised border border-border-visible rounded-xl sm:rounded-2xl h-11 sm:h-12 px-3 sm:px-4 text-right text-sm sm:text-base",
            "text-foreground placeholder:text-foreground-dim",
            "focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30",
            "transition-all duration-300",
            disabled && "opacity-40 cursor-not-allowed",
            error && "border-danger/50 focus:ring-danger/50"
          )}
        />
      ) : (
        <div className="w-full bg-surface-raised border border-border-visible rounded-xl sm:rounded-2xl h-11 sm:h-12" />
      )}
      {error && (
        <p className="mt-1.5 text-xs sm:text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
