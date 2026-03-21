import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background">
      <main className="flex flex-col items-center gap-10">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-primary mb-3">كلمة</h1>
          <p className="text-xl text-foreground/60">لعبة المحتال</p>
        </div>

        <div className="flex flex-col gap-4 w-64">
          <Link
            href="/create"
            className="flex h-14 items-center justify-center rounded-xl bg-primary text-white text-lg font-semibold transition-colors hover:bg-primary-hover"
          >
            انشاء غرفة
          </Link>
          <Link
            href="/join"
            className="flex h-14 items-center justify-center rounded-xl border border-foreground/20 text-foreground text-lg font-semibold transition-colors hover:bg-foreground/10"
          >
            انضم لغرفة
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-6 text-center w-full">
        <span className="text-sm text-foreground/30">الإصدار 1.0</span>
      </footer>
    </div>
  );
}
