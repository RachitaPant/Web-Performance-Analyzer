"use client";

import ProtectedRoute from "@/components/ProtectedRoute/page";
import DashboardLayout from "@/components/DashboardLayout/page";
import DashboardResults from "@/components/DashboardResults/page";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout activePage="overview">
        <DashboardResults />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
