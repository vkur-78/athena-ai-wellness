"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isLight } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for recovery session from Supabase
  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      try {
        // 1. Check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (active) {
            setSessionValid(true);
            setVerifyingSession(false);
          }
          return;
        }

        // 2. Check hash or query for tokens
        if (typeof window !== "undefined") {
          const hash = window.location.hash;
          if (hash.includes("access_token") || hash.includes("type=recovery")) {
            // Give Supabase client a moment to parse the hash
            const { data } = await supabase.auth.getSession();
            if (data?.session && active) {
              setSessionValid(true);
              setVerifyingSession(false);
              return;
            }
          }
        }

        // 3. Listen to auth state change for PASSWORD_RECOVERY
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
              if (active) {
                setSessionValid(true);
                setVerifyingSession(false);
              }
            }
          }
        );

        // Fallback timeout: if after 2.5s no valid session detected, mark as expired/invalid
        setTimeout(() => {
          if (active) {
            setVerifyingSession((prev) => {
              if (prev) {
                // Check once more before finalizing
                supabase.auth.getSession().then(({ data }) => {
                  if (data?.session) {
                    setSessionValid(true);
                  } else {
                    setSessionValid(false);
                  }
                });
              }
              return false;
            });
          }
        }, 2500);

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        if (active) {
          setVerifyingSession(false);
          setSessionValid(false);
        }
      }
    }

    checkRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasMixedCase && hasNumberOrSymbol && passwordsMatch;

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password.trim(),
      });

      if (error) {
        throw new Error(error.message || "Failed to update password.");
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "Unable to reset password. The link may have expired.");
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-4 transition-colors duration-200">
      <div className="sanctuary-aurora-bg pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[0_20px_48px_-8px_rgba(0,0,0,0.3)] backdrop-blur-2xl p-8 sm:p-10 pointer-events-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
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
            Reset Your Password
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
            Choose a strong, private password for your Athena Sanctuary.
          </p>
        </div>

        {verifyingSession ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
            <p className="text-xs text-[var(--text-secondary)]">
              Verifying your secure password reset link...
            </p>
          </div>
        ) : !sessionValid && !success ? (
          /* Invalid or Expired Reset Link */
          <div className="space-y-5 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Reset Link Expired or Invalid
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                This password recovery link is either invalid, already used, or expired.
                For your security, reset links are single-use and time-limited.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 px-4 text-xs font-semibold shadow-md transition"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : success ? (
          /* Password Successfully Changed */
          <div className="space-y-5 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={30} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Password Successfully Updated
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your password has been changed securely. You can now sign in with your new credentials.
              </p>
            </div>

            <div className="pt-3">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 px-5 text-xs font-semibold shadow-lg shadow-[#7C5CFF]/30 transition hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Return to Sign In</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          /* Enter New Password Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/40 bg-red-950/20 p-3.5 text-xs text-red-400">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">New Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
                <input
                  id="reset-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Enter at least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-background)] py-3 pl-10 pr-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Confirm New Password</label>
              <div className="relative flex items-center">
                <KeyRound className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
                <input
                  id="reset-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-background)] py-3 pl-10 pr-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 p-3 space-y-1.5 text-[11px] text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? "bg-emerald-400" : "bg-[var(--text-muted)]"}`} />
                <span className={hasMinLength ? "text-emerald-400 font-medium" : ""}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${hasMixedCase ? "bg-emerald-400" : "bg-[var(--text-muted)]"}`} />
                <span className={hasMixedCase ? "text-emerald-400 font-medium" : ""}>Uppercase and lowercase letters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${hasNumberOrSymbol ? "bg-emerald-400" : "bg-[var(--text-muted)]"}`} />
                <span className={hasNumberOrSymbol ? "text-emerald-400 font-medium" : ""}>At least one number or special character</span>
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className={passwordsMatch ? "text-emerald-400 font-medium" : "text-red-400"}>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </span>
                </div>
              )}
            </div>

            <button
              id="reset-submit"
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border border-[var(--border-strong)] py-3.5 text-sm font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Updating Password..." : "Update Password"}
              {!loading && <ArrowRight size={16} />}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition underline-offset-4 hover:underline"
              >
                Cancel and return to sign in
              </Link>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-6">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted Supabase Authentication • End-to-end security</span>
        </div>
      </div>
    </main>
  );
}
