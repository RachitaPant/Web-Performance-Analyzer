import { AuthProvider } from "@/lib/AuthProvider";

// Sign-in state is only needed on the dashboard. Providing it here instead of in the root layout
// keeps Firebase off pages that never use it (the landing page loaded ~290 KB of JS including
// Firebase Auth and Firestore before this).
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProvider>{children}</AuthProvider>;
}
