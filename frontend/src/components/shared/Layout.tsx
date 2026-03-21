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
        <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      )}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
