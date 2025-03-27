import PDFChatInterface from "@/components/chat-section";
import { ConsumerDashboard } from "@/components/consumer/dashboard";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardShell } from "@/components/dashboard-shell";

import React from "react";

const ConsumerChat = () => {
  return (
    <>
      {/* <DashboardHeader
        heading="Consumer Dashboard"
        text="Manage your assigned jurisdictions and operations."
      /> */}
      <ConsumerDashboard />
    </>
  );
};

export default ConsumerChat;
