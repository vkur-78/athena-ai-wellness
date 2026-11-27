"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage, initDemoSessionApi } from "@/lib/api";
import { getOrCreateDemoDeviceId, syncAndPersistDemoSession } from "@/lib/auth";
import Loading from "@/components/common/Loading";

/**
 * Intentionally supported direct demo route (/demo).
 * Explicit entry point that initializes an isolated demo session and navigates to the sanctuary.
 */
export default function DirectDemoPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wakingUp, setWakingUp] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let active = true;

    const wakeTimer = setTimeout(() => {
      if (active) setWakingUp(true);
    }, 3000);

    async function initDirectDemo() {
      try {
        const deviceId = getOrCreateDemoDeviceId();
        const data = await initDemoSessionApi(deviceId);
        if (!active) return;

        await syncAndPersistDemoSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          session_id: data.session_id,
          user_id: data.user_id,
          email: data.email || "aarav.sharma.demo@athena.sanctuary",
        });

        clearTimeout(wakeTimer);
        window.location.href = "/";
      } catch (err: unknown) {
        clearTimeout(wakeTimer);
        if (!active) return;
        setErrorMsg(getErrorMessage(err, "Failed to initialize demo journey."));
      }
    }

    initDirectDemo();
    return () => {
      active = false;
      clearTimeout(wakeTimer);
    };
  }, []);

  if (errorMsg) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#060814] text-white space-y-4">
        <p className="text-red-400 text-sm text-center max-w-md">{errorMsg}</p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="px-4 py-2 text-xs rounded-xl bg-[#7C5CFF] text-white hover:bg-[#6A4BE2] transition cursor-pointer"
        >
          Return to Sanctuary Login
        </button>
      </main>
    );
  }

  return (
    <Loading
      label="Entering Athena Demo Sanctuary..."
      sublabel={
        wakingUp
          ? "Athena is waking up. This may take around a minute. Thanks for your patience."
          : "Preparing your interactive guided evaluation journey"
      }
      fullScreen={true}
    />
  );
}
