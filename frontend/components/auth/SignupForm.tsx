"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { registerUserApi } from "@/lib/api";
import { clearDemoSessionStorage, persistAthenaSession } from "@/lib/auth";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Heart } from "lucide-react";

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function signup(e?: React.FormEvent) {
    if (e) e.preventDefault();

    let targetEmail = email.trim();
    let targetPassword = password.trim();

    if ((!targetEmail || !targetPassword) && e?.currentTarget) {
      try {
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const formEmail = formData.get("email") as string;
        const formPass = formData.get("password") as string;
        if (formEmail) targetEmail = formEmail.trim();
        if (formPass) targetPassword = formPass.trim();
      } catch (fdErr) {
        console.warn("FormData extraction fallback:", fdErr);
      }
    }

    if (!targetEmail || !targetPassword) {
      setErrorMsg("Please enter both email and a secure password.");
      return;
    }
    if (targetPassword.length < 6) {
      setErrorMsg("Please choose a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await registerUserApi(targetEmail, targetPassword);

      if (res && res.access_token) {
        persistAthenaSession({
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          user_id: res.user_id,
          email: res.email || targetEmail,
          user_metadata: { full_name: (res.email || targetEmail).split("@")[0] },
        });

        try {
          await supabase.auth.setSession({
            access_token: res.access_token,
            refresh_token: res.refresh_token || res.access_token,
          });
        } catch (setErr) {
          console.warn("[Signup Session Sync Note]:", setErr);
        }
      }

      clearDemoSessionStorage();
      setLoading(false);
      window.location.href = "/onboarding";
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Registration failed. Please check your details.");
    }
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-xl shadow-[#7C5CFF]/30 border border-[var(--border-strong)] bg-[var(--surface)]">
          <Image
            src="/athena-logo.png"
            alt="Athena Logo"
            width={64}
            height={64}
            className="object-cover"
            priority
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Begin Your Journey with Athena
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Create your private sanctuary. Save conversations, track emotional progress, and build a lasting therapeutic companion.
        </p>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/40 bg-red-950/20 p-3.5 text-xs text-red-400">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={signup} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-background)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Choose a Secure Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-background)] py-3 pl-10 pr-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border border-[var(--border-strong)] py-3.5 text-sm font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Creating your sanctuary..." : "Create Account & Start"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-2 text-center space-y-3 text-xs text-[var(--text-muted)]">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline font-semibold underline-offset-4">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-2">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Registered accounts only • Encrypted & private sanctuary</span>
      </div>
    </div>
  );
}