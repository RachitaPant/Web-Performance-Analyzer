"use client";

import ProtectedRoute from "@/components/ProtectedRoute/page";
import Dashboard from "@/components/Dashboard/page";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
