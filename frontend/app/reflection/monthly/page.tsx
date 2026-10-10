"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MonthlyReflectionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/replay/monthly");
  }, [router]);

  return (
    <main className="flex h-screen w-full items-center justify-center bg-[#060814] font-serif text-sm text-[#B8BDD6]">
      <span>Opening Monthly Keepsake...</span>
    </main>
  );
}
