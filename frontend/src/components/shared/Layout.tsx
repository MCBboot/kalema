"use client";
import { cn } from "@/utils/rtl";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background text-foreground")}>
      {title && (
        <div className="px-4 sm:px-6 pt-8 sm:pt-10 pb-2 max-w-md sm:max-w-lg mx-auto w-full animate-fade-up">
          <h1 className="text-xl sm:text-2xl font-bold text-accent">{title}</h1>
          <div className="h-px w-16 mt-3 bg-gradient-to-l from-transparent via-accent/30 to-transparent" />
        </div>
      )}
      <main className="flex-1 max-w-md sm:max-w-lg mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 pb-[env(safe-area-inset-bottom,16px)]">
        {children}
      </main>
    </div>
  );
}
