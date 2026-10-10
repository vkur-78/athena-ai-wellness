"use client";

import React from "react";
import { useEntitlement } from "@/context/EntitlementContext";
import TrialReminderBanner from "./TrialReminderBanner";
import UpgradeModal from "./UpgradeModal";

export default function GlobalUpgradeContainer() {
  const { isUpgradeModalOpen, closeUpgradeModal, isTrialExpired } = useEntitlement();

  return (
    <>
      <TrialReminderBanner />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={closeUpgradeModal}
        isMandatoryExpired={isTrialExpired}
      />
    </>
  );
}
