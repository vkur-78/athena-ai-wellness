"use client";

import { ShieldAlert, X, Heart } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrisisModal({ isOpen, onClose }: CrisisModalProps) {
  const { isLight } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-[28px] border p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 transition-colors ${
          isLight
            ? "bg-[#FFFFFF] border-rose-300 text-stone-900 shadow-xl"
            : "sanctuary-glass border-rose-500/30 text-[#F8F7FF] shadow-[0_0_40px_rgba(244,63,94,0.15)]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-400 font-semibold text-base sm:text-lg">
            <Heart size={19} className="fill-rose-500/20 text-rose-400" />
            <span>Care &amp; Immediate Safety</span>
          </div>
          <button
            onClick={onClose}
            className={`rounded-2xl p-2 transition cursor-pointer ${
              isLight
                ? "text-stone-400 hover:bg-stone-200 hover:text-stone-900"
                : "text-[#B8BDD6] hover:bg-[#7C5CFF]/20 hover:text-[#F8F7FF]"
            }`}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <p
          className={`text-xs sm:text-sm leading-relaxed ${
            isLight ? "text-stone-600" : "text-[#B8BDD6]"
          }`}
        >
          If you or someone you know is struggling or in crisis, gentle and dedicated help is available. You are not alone and there are caring professionals ready to listen and support you 24/7.
        </p>

        <div className="space-y-3">
          <div
            className={`rounded-2xl border p-4 flex items-center justify-between transition-colors ${
              isLight
                ? "bg-rose-50/60 border-rose-200"
                : "bg-[#060814]/70 border-[#7C5CFF]/20"
            }`}
          >
            <div>
              <h4
                className={`text-xs sm:text-sm font-semibold ${
                  isLight ? "text-stone-900" : "text-[#F8F7FF]"
                }`}
              >
                Suicide &amp; Crisis Lifeline (US &amp; Canada)
              </h4>
              <p
                className={`text-[11px] ${
                  isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
                }`}
              >
                Call or text 988 anytime · Free &amp; Confidential
              </p>
            </div>
            <a
              href="tel:988"
              className="rounded-xl px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_14px_rgba(244,63,94,0.4)] transition cursor-pointer"
            >
              Call 988
            </a>
          </div>

          <div
            className={`rounded-2xl border p-4 flex items-center justify-between transition-colors ${
              isLight
                ? "bg-stone-50 border-stone-200"
                : "bg-[#060814]/70 border-[#7C5CFF]/20"
            }`}
          >
            <div>
              <h4
                className={`text-xs sm:text-sm font-semibold ${
                  isLight ? "text-stone-900" : "text-[#F8F7FF]"
                }`}
              >
                Crisis Text Line
              </h4>
              <p
                className={`text-[11px] ${
                  isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
                }`}
              >
                Text HOME to 741741 · 24/7 Crisis Counselor
              </p>
            </div>
            <a
              href="sms:741741?body=HOME"
              className={`rounded-xl px-4 py-2 text-xs font-medium border transition cursor-pointer ${
                isLight
                  ? "bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300"
                  : "bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#F8F7FF] hover:bg-[#7C5CFF]/25 shadow-sm"
              }`}
            >
              Text 741741
            </a>
          </div>

          <div
            className={`rounded-2xl border p-4 flex items-center justify-between transition-colors ${
              isLight
                ? "bg-stone-50 border-stone-200"
                : "bg-[#060814]/70 border-[#7C5CFF]/20"
            }`}
          >
            <div>
              <h4
                className={`text-xs sm:text-sm font-semibold ${
                  isLight ? "text-stone-900" : "text-[#F8F7FF]"
                }`}
              >
                International Emergency Services
              </h4>
              <p
                className={`text-[11px] ${
                  isLight ? "text-stone-500" : "text-[#B8BDD6]/70"
                }`}
              >
                UK: 999 / 111 · EU: 112 · India: 112 / 100
              </p>
            </div>
            <a
              href="tel:112"
              className={`rounded-xl px-4 py-2 text-xs font-medium border transition cursor-pointer ${
                isLight
                  ? "bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300"
                  : "bg-[#7C5CFF]/15 border-[#7C5CFF]/30 text-[#F8F7FF] hover:bg-[#7C5CFF]/25 shadow-sm"
              }`}
            >
              Call 112
            </a>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className={`rounded-xl px-5 py-2 text-xs font-medium transition cursor-pointer ${
              isLight
                ? "bg-stone-200 hover:bg-stone-300 text-stone-800"
                : "border border-[#7C5CFF]/20 bg-[#0B1228] text-[#B8BDD6] hover:text-[#F8F7FF] hover:bg-[#7C5CFF]/15"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
