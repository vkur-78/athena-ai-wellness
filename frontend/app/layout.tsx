import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CheckInProvider } from "@/context/CheckInContext";
import { EntitlementProvider } from "@/context/EntitlementContext";
import { TourProvider } from "@/context/TourContext";
import { InteractiveTourOverlay } from "@/components/tour/InteractiveTourOverlay";
import RouteVoiceCleanup from "@/components/common/RouteVoiceCleanup";
import GlobalUpgradeContainer from "@/components/upgrade/GlobalUpgradeContainer";

export const metadata = {
  title: "Athena — Calm AI Wellness Sanctuary",
  description: "A calm AI wellness companion for reflection, breathwork, and mindful presence.",
  icons: {
    icon: [
      { url: "/athena-logo.png", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/athena-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <EntitlementProvider>
              <GlobalUpgradeContainer />
              <CheckInProvider>
                <TourProvider>
                  <RouteVoiceCleanup />
                  <InteractiveTourOverlay />
                  {children}
                </TourProvider>
              </CheckInProvider>
            </EntitlementProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}