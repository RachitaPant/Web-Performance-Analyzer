"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GithubAuthProvider,
} from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button/page";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Redirect login successful:", result.user);
          setTimeout(() => router.push("/"), 500);
        }
      } catch (error: any) {
        console.error("Redirect login error:", {
          code: error.code,
          message: error.message,
        });
        setError(`Redirect login failed: ${error.message}`);
      }
    };

    handleRedirect();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTimeout(() => router.push("/"), 500);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const provider = new GithubAuthProvider();
      provider.addScope("user:email");
      console.log("Opening popup...");
      await signInWithPopup(auth, provider).catch(async (error) => {
        console.log("Popup error:", error.code, error.message);
        if (
          error.code === "auth/cancelled-popup-request" ||
          error.code === "auth/popup-blocked" ||
          error.message.includes("DNS") ||
          error.message.includes("host")
        ) {
          console.log("Falling back to redirect...");
          await signInWithRedirect(auth, provider);
        } else {
          throw error;
        }
      });
      console.log("GitHub login successful");
    } catch (error: any) {
      console.error("GitHub login error:", {
        code: error.code,
        message: error.message,
      });
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return (
    <div className="flex h-screen w-full md:flex-row flex-col">
      <div className="relative h-1/2 md:h-full md:flex md:w-1/2 bg-black overflow-hidden">
        <Image
          src="/images/login/cosmic.jpg"
          alt="Cosmic landscape"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        <div className="relative z-10 flex flex-col justify-between w-full h-full p-8">
          <div className="flex justify-between items-center">
            <div className="text-white font-medium">
              Improving Your Online Experience
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src="/images/login/rachita.png"
                  alt="Profile"
                  width={40}
                  height={40}
                  style={{ width: "auto", height: "auto" }}
                  className="object-cover"
                />
              </div>
              <div className="text-white">
                <div className="font-medium">Rachita Pant</div>
                <div className="text-sm text-white/70">
                  Design and Development
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-black">Hi Developer</h1>
              <p className="text-gray-800">Welcome to AnalyzeAI</p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={handleLogin}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login with GitHub"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="text-center text-sm text-gray-500">
                Don’t have an account?
                <Link
                  onClick={handleLogin}
                  href="#"
                  className="text-red-500 hover:underline ml-1"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
