"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { fetchUserProfile, loginUserApi } from "@/lib/api";
import { clearDemoSessionStorage, persistAthenaSession } from "@/lib/auth";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clear any residual demo state on login page mount
  useEffect(() => {
    clearDemoSessionStorage();
  }, []);

  async function loginAsDemoUser() {
    setLoading(true);
    setErrorMsg(null);
    try {
      let deviceId = "";
      if (typeof window !== "undefined") {
        deviceId = localStorage.getItem("athena_demo_device_id") || "";
        if (!deviceId) {
          deviceId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "dev_" + Math.random().toString(36).slice(2) + Date.now();
          localStorage.setItem("athena_demo_device_id", deviceId);
        }
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (deviceId) {
        headers["X-Demo-Device-Id"] = deviceId;
      }

      const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/auth/demo-session`, {
        method: "POST",
        headers,
        body: JSON.stringify({ device_id: deviceId }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const errData = await res.json();
          detail = errData.detail || errData.message || "";
        } catch {
          try {
            detail = await res.text();
          } catch {}
        }
        throw new Error(detail || "Could not initialize demo session.");
      }

      const data = await res.json();
      if (data && data.access_token) {
        const refreshToken = data.refresh_token || data.access_token;
        try {
          const sessionObj = {
            access_token: data.access_token,
            refresh_token: refreshToken,
            expires_at: Math.floor(Date.now() / 1000) + 86400,
            expires_in: 86400,
            token_type: "bearer",
            user: {
              id: data.user_id,
              email: data.email || "aarav.sharma.demo@athena.sanctuary",
              aud: "authenticated",
              role: "authenticated",
              created_at: "2024-10-15T00:00:00Z",
              user_metadata: {
                full_name: "Aarav Sharma",
                is_demo: true,
              },
            },
          };
          localStorage.setItem("sb-yvmqdlqpfuirapznbmrj-auth-token", JSON.stringify(sessionObj));
          localStorage.setItem("athena_demo_mode", "true");
          localStorage.setItem("athena_demo_token", data.access_token);
          localStorage.setItem("athena_demo_session_id", data.session_id);
        } catch {}

        try {
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: refreshToken,
          });
        } catch (setErr) {
          console.warn("[Demo Supabase Session Set Warning]:", setErr);
        }

        window.location.href = "/";
        return;
      }
      throw new Error("Failed to initialize demo session.");
    } catch (err: any) {
      setLoading(false);
      setErrorMsg("Demo access: " + (err.message || "Please try again shortly."));
    }
  }

  async function login(e?: React.FormEvent) {
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
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let accessToken = "";
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword,
      });

      if (!error && data.session) {
        accessToken = data.session.access_token;
        persistAthenaSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user_id: data.user?.id,
          email: targetEmail,
          user_metadata: data.user?.user_metadata,
        });
      } else {
        // Fallback to backend login API if direct client auth fails
        try {
          const fallbackRes = await loginUserApi(targetEmail, targetPassword);
          if (fallbackRes && fallbackRes.access_token) {
            accessToken = fallbackRes.access_token;
            persistAthenaSession({
              access_token: fallbackRes.access_token,
              refresh_token: fallbackRes.refresh_token,
              user_id: fallbackRes.user_id,
              email: fallbackRes.email || targetEmail,
              user_metadata: { full_name: (fallbackRes.email || targetEmail).split("@")[0] },
            });

            if (fallbackRes.refresh_token) {
              try {
                await supabase.auth.setSession({
                  access_token: fallbackRes.access_token,
                  refresh_token: fallbackRes.refresh_token,
                });
              } catch (setErr) {
                console.warn("[Session Set Warning]:", setErr);
              }
            }
          } else {
            throw new Error(error?.message || "Invalid email or password.");
          }
        } catch (apiErr: any) {
          throw new Error(apiErr.message || error?.message || "Invalid email or password. Please check your credentials.");
        }
      }

      clearDemoSessionStorage();
      setLoading(false);

      window.location.href = "/";
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || "Invalid email or password. Please check your credentials.");
    }
  }

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    const target = forgotEmail.trim() || email.trim();
    if (!target) {
      setForgotError("Please enter your email address.");
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "http://localhost:3000/reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Log quietly on dev but do not leak details
        console.warn("[Reset Password Notice]:", error.message);
      }

      // Always show success message to prevent user enumeration
      setForgotSubmitted(true);
      setForgotLoading(false);
    } catch (err: any) {
      setForgotLoading(false);
      setForgotSubmitted(true);
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
          {showForgotPassword ? "Reset Password" : "Welcome back to Athena"}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          {showForgotPassword
            ? "Enter your email address and we'll send you a secure link to reset your password."
            : "Your safe, confidential sanctuary for mental wellness and gentle reflection."}
        </p>
      </div>

      {showForgotPassword ? (
        /* Forgot Password Sub-Flow */
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {forgotSubmitted ? (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Check your email
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  If an Athena account is associated with <strong className="text-[var(--text-primary)]">{forgotEmail || email}</strong>, you will receive a secure password reset link shortly.
                </p>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Be sure to check your spam or junk folder if you don&apos;t see it in a few minutes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSubmitted(false);
                }}
                className="w-full mt-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {forgotError && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/40 bg-red-950/20 p-3.5 text-xs text-red-400">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{forgotError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-background)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                    placeholder="you@example.com"
                    value={forgotEmail || email}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                disabled={forgotLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border border-[var(--border-strong)] py-3.5 text-sm font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {forgotLoading ? "Sending Reset Link..." : "Send Password Reset Link"}
                {!forgotLoading && <ArrowRight size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition pt-1 cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Normal Login Form */
        <>
          {/* Error notification */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/40 bg-red-950/20 p-3.5 text-xs text-red-400">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={login} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
                <input
                  id="login-email"
                  name="email"
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--text-secondary)]">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotPassword(true);
                  }}
                  className="text-xs text-[var(--accent)] hover:underline font-medium underline-offset-4 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-[var(--text-muted)]" size={17} />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input-background)] py-3 pl-10 pr-11 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition"
                  placeholder="Enter your password"
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
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border border-[var(--border-strong)] py-3.5 text-sm font-semibold shadow-md transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In to Your Sanctuary"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Demo Journey Entry for Portfolio, HR, and Evaluators */}
          <div className="pt-2 border-t border-[var(--border)] space-y-2">
            <button
              type="button"
              id="demo-mode-button"
              disabled={loading}
              onClick={loginAsDemoUser}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 py-3 px-4 text-xs font-semibold shadow-xs transition-all duration-120 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>✨ Explore Demo Journey</span>
            </button>
            <p className="text-[11px] text-center text-[var(--text-muted)]">
              Explore a populated 24-month Athena journey — no account required.
            </p>
          </div>

          {/* Switch to Signup */}
          <div className="pt-1 text-center space-y-3 text-xs text-[var(--text-muted)]">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[var(--accent)] hover:underline font-semibold underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Registered accounts only • Encrypted & private sanctuary</span>
          </div>
        </>
      )}
    </div>
  );
}