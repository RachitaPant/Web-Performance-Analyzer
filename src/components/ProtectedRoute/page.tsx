"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="text-center mt-20 text-gray-500">
        Hello There, Wait a min
      </div>
    );
  }

  return <>{children}</>;
}
