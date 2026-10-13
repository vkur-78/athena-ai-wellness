"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { persistDemoSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/common/Loading";

/**
 * Intentionally supported direct demo route (/demo).
 * Explicit entry point that initializes an isolated demo session and navigates to the sanctuary.
 */
export default function DirectDemoPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initDirectDemo() {
      try {
        let deviceId = "";
        if (typeof window !== "undefined") {
          deviceId = localStorage.getItem("athena_demo_device_id") || "";
          if (!deviceId) {
            deviceId =
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : "dev_" + Math.random().toString(36).slice(2) + Date.now();
            localStorage.setItem("athena_demo_device_id", deviceId);
          }
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (deviceId) {
          headers["X-Demo-Device-Id"] = deviceId;
        }

        let directBackendUrl = "https://athena-ai-wellness.onrender.com";
        if (typeof window !== "undefined") {
          const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          if (isLocal) {
            directBackendUrl = "http://127.0.0.1:8001";
          }
        }
        if (process.env.NEXT_PUBLIC_BACKEND_URL) {
          const custom = process.env.NEXT_PUBLIC_BACKEND_URL.trim().replace(/\/+$/, "");
          if (
            custom.startsWith("https://athena-ai-wellness.onrender.com") ||
            custom.startsWith("http://127.0.0.1") ||
            custom.startsWith("http://localhost")
          ) {
            directBackendUrl = custom;
          }
        }

        let res: Response | null = null;
        let primaryErr: any = null;
        try {
          res = await fetch(`${apiUrl.replace(/\/+$/, "")}/auth/demo-session`, {
            method: "POST",
            headers,
            body: JSON.stringify({ device_id: deviceId }),
          });
          if (!res.ok && res.status >= 500) {
            primaryErr = new Error(`Edge proxy returned ${res.status}`);
            res = null;
          }
        } catch (err: any) {
          primaryErr = err;
          res = null;
        }

        if (!res && directBackendUrl) {
          try {
            res = await fetch(`${directBackendUrl}/api/auth/demo-session`, {
              method: "POST",
              headers,
              body: JSON.stringify({ device_id: deviceId }),
            });
          } catch (fallbackErr) {
            throw primaryErr || fallbackErr;
          }
        }

        if (!res || !res.ok) {
          throw new Error("Could not initialize direct demo session.");
        }

        const data = await res.json();
        if (!active) return;

        if (data && data.access_token) {
          persistDemoSession({
            access_token: data.access_token,
            session_id: data.session_id,
            user_id: data.user_id,
            email: data.email || "aarav.sharma.demo@athena.sanctuary",
          });

          try {
            await supabase.auth.setSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token || data.access_token,
            });
          } catch (setErr) {
            console.warn("[Direct Demo Supabase Set Note]:", setErr);
          }

          window.location.href = "/";
          return;
        }
        throw new Error("Invalid demo token returned.");
      } catch (err: any) {
        if (!active) return;
        setErrorMsg(err?.message || "Failed to initialize demo journey.");
      }
    }

    initDirectDemo();
    return () => {
      active = false;
    };
  }, []);

  if (errorMsg) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#060814] text-white space-y-4">
        <p className="text-red-400 text-sm">{errorMsg}</p>
        <button
          onClick={() => router.replace("/login")}
          className="px-4 py-2 text-xs rounded-xl bg-[#7C5CFF] text-white hover:bg-[#6A4BE2] transition"
        >
          Return to Sanctuary Login
        </button>
      </main>
    );
  }

  return (
    <Loading
      label="Entering Athena Demo Sanctuary..."
      sublabel="Preparing your interactive guided evaluation journey"
      fullScreen={true}
    />
  );
}
