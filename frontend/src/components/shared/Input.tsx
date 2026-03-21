"use client";
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
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground/70 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={cn(
          "w-full bg-foreground/5 border border-foreground/20 rounded-xl h-12 px-4 text-right",
          "text-foreground placeholder:text-foreground/30",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "transition-colors duration-200",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-500 focus:ring-red-500"
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
