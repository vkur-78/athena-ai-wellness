"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Wind, BookOpen, Heart, ArrowUpRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface SanctuaryQuickActionsProps {
  onOpenCareCenter: () => void;
}

export default React.memo(function SanctuaryQuickActions({
  onOpenCareCenter,
}: SanctuaryQuickActionsProps) {
  const { isLight } = useTheme();

  const actions = [
    {
      id: "conversation",
      label: "Continue Conversation",
      description: "Pick up mindful dialogue",
      href: "/chat",
      icon: MessageSquare,
      accentBg: isLight ? "bg-amber-50 text-amber-800" : "bg-amber-500/10 text-amber-300",
    },
    {
      id: "studio",
      label: "Open Studio",
      description: "Immerse in living sound & breath",
      href: "/studio",
      icon: Wind,
      accentBg: isLight ? "bg-teal-50 text-teal-800" : "bg-teal-500/10 text-teal-300",
    },
    {
      id: "space",
      label: "Write in Space",
      description: "Record quiet contemplation",
      href: "/journal",
      icon: BookOpen,
      accentBg: isLight ? "bg-rose-50 text-rose-800" : "bg-rose-500/10 text-rose-300",
    },
    {
      id: "care",
      label: "View Care Center",
      description: "Support is always within reach",
      onClick: onOpenCareCenter,
      icon: Heart,
      accentBg: isLight ? "bg-indigo-50 text-indigo-800" : "bg-indigo-500/10 text-indigo-300",
    },
  ];

  return (
    <section aria-label="Sanctuary Quick Actions" className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-serif font-semibold tracking-tight">Quick Actions</h3>
        <span className="text-[11px] opacity-60">Direct sanctuary paths</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          const ButtonContent = (
            <div
              className={`group flex items-center justify-between p-4 sm:p-4.5 rounded-[18px] border transition-all duration-180 active:scale-[0.98] ${
                isLight
                  ? "bg-white/95 hover:bg-stone-50/90 border-stone-200/90 shadow-xs hover:shadow-md hover:border-stone-300"
                  : "bg-[#1a1b22]/95 hover:bg-[#20222a]/90 border-[#282a36] shadow-sm hover:shadow-md hover:border-[#383a4a]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border border-inherit/40 ${action.accentBg}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-serif font-medium tracking-tight group-hover:text-amber-700 dark:group-hover:text-violet-300 transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-[11px] opacity-60 mt-0.5 font-serif">
                    {action.description}
                  </p>
                </div>
              </div>

              <ArrowUpRight
                size={14}
                className="opacity-40 group-hover:opacity-100 transition-all duration-180 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          );

          if (action.href) {
            return (
              <Link
                key={action.id}
                href={action.href}
                className="block cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-[18px]"
              >
                {ButtonContent}
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className="w-full text-left cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-[18px]"
            >
              {ButtonContent}
            </button>
          );
        })}
      </div>
    </section>
  );
});
