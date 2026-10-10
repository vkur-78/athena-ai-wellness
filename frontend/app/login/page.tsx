"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4 transition-colors duration-200">
      <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[0_20px_48px_-8px_rgba(0,0,0,0.3)] backdrop-blur-2xl p-8 sm:p-10 pointer-events-auto">
        <LoginForm />
      </div>
    </main>
  );
}