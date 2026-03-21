"use client";
import { useRouter } from "next/navigation";

interface ReconnectBannerProps {
  status: "reconnecting" | "failed";
}

export default function ReconnectBanner({ status }: ReconnectBannerProps) {
  const router = useRouter();

  if (status === "failed") {
    return (
      <div className="sticky top-0 z-50 w-full bg-red-600 text-white px-4 py-3 text-center shadow-lg">
        <p className="text-sm font-semibold">انتهت صلاحية الجلسة</p>
        <button
          onClick={() => router.replace("/")}
          className="mt-2 rounded-lg bg-white text-red-600 px-4 py-1.5 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-amber-500 text-white px-4 py-3 text-center shadow-lg animate-pulse">
      <p className="text-sm font-semibold">جاري إعادة الاتصال...</p>
    </div>
  );
}
