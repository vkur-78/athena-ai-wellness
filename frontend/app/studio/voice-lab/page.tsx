"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { StudioVoiceQAPanel } from "@/components/studio/StudioVoiceQAPanel";

export default function VoiceLabPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center p-4">
      <StudioVoiceQAPanel isOpen={true} onClose={() => router.push("/studio")} />
    </div>
  );
}
