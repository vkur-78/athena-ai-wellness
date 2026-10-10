"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WeeklyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/replay?type=weekly");
  }, [router]);

  return (
    <main className="flex h-screen w-full items-center justify-center font-serif text-sm text-stone-500 dark:text-zinc-400">
      <span>Opening Weekly Living Replay...</span>
    </main>
  );
}
