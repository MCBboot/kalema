"use client";
import { useRouter } from "next/navigation";

interface ReconnectBannerProps {
  status: "reconnecting" | "failed";
}

export default function ReconnectBanner({ status }: ReconnectBannerProps) {
  const router = useRouter();

  if (status === "failed") {
    return (
      <div className="sticky top-0 z-50 w-full bg-danger text-white px-4 py-3 text-center">
        <p className="text-sm font-bold">انتهت صلاحية الجلسة</p>
        <button
          onClick={() => router.replace("/")}
          className="mt-2 rounded-xl bg-white text-danger px-5 py-1.5 text-sm font-bold hover:bg-danger/10 hover:text-white border border-white/20 transition-all cursor-pointer"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-accent text-background px-4 py-3 text-center animate-pulse">
      <p className="text-sm font-bold">جاري إعادة الاتصال...</p>
    </div>
  );
}
