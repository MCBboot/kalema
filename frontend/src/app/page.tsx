import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Atmospheric gradient orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <main className="flex flex-col items-center gap-14 animate-fade-up relative z-10">
        {/* Title lockup */}
        <div className="text-center space-y-3">
          <div className="relative">
            <h1 className="text-8xl font-bold text-accent tracking-tight">كلمة</h1>
            <div className="absolute -inset-4 bg-accent/5 blur-2xl rounded-full -z-10" />
          </div>
          <div className="h-px w-24 mx-auto bg-gradient-to-l from-transparent via-accent/40 to-transparent" />
          <p className="text-lg text-foreground-muted tracking-wide">لعبة المحتال</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-72 stagger">
          <Link
            href="/create"
            className="group flex h-14 items-center justify-center rounded-2xl bg-accent text-background text-lg font-bold transition-all duration-300 hover:bg-accent-hover hover:shadow-[0_0_30px_var(--accent-dim)] active:scale-[0.98]"
          >
            انشاء غرفة
          </Link>
          <Link
            href="/join"
            className="group flex h-14 items-center justify-center rounded-2xl border border-border-visible text-foreground text-lg font-semibold transition-all duration-300 hover:border-accent/40 hover:text-accent hover:bg-accent-glow active:scale-[0.98]"
          >
            انضم لغرفة
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-6 text-center w-full">
        <span className="text-xs text-foreground-dim tracking-wider">v1.0</span>
      </footer>
    </div>
  );
}
