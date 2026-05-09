"use client";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import RoomClient from "./RoomClient";
import Layout from "@/components/shared/Layout";

// Since Next.js static export requires known paths at build time,
// dynamic routes like /room/[code] don't work natively for fully client-side PWAs.
// Instead we load everything under /room and parse the code client-side
export default function Room() {
  const router = useRouter();

  useEffect(() => {
    // If we land here directly, redirect
    const url = new URL(window.location.href);
    if (!url.searchParams.has('code')) {
       router.replace("/");
    }
  }, [router]);

  return (
    <Suspense fallback={<Layout><div className="flex items-center justify-center py-20"><span className="text-foreground-dim text-sm">...</span></div></Layout>}>
       <RoomClient />
    </Suspense>
  );
}
