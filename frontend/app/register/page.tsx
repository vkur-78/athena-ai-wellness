"use client";

import SignupForm from "@/components/auth/SignupForm";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4 transition-colors duration-200">
      <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[0_20px_48px_-8px_rgba(0,0,0,0.3)] backdrop-blur-2xl p-8 sm:p-10 pointer-events-auto">
        <SignupForm />
      </div>
    </main>
  );
}
