"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
} from "firebase/auth";

export default function SitePulseLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account created! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Enter your email address above, then click 'Forgot password?'");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signInAnonymously(auth);
      setSuccess("Signed in as demo user! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Demo sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020e1d] via-[#0a1929] to-[#020e1d] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-16">
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-pink-500" />
              <span className="text-lg font-bold">SitePulse</span>
            </div>
          </Link>

          <h1 className="text-4xl font-bold mb-4">
            {isLogin ? "Welcome Back" : "Get Started"}
          </h1>
          <p className="text-gray-400 text-lg">
            {isLogin
              ? "Analyze your website performance instantly"
              : "Create an account to start analyzing"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-gradient-to-b from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-10 backdrop-blur-sm">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-blue-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-blue-950/40 border border-blue-500/50 rounded-lg pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-blue-950/60 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-blue-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-blue-950/40 border border-blue-500/50 rounded-lg pl-12 pr-12 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-blue-950/60 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-blue-400 hover:text-blue-300 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-blue-500/50 bg-blue-950/40"
                  />
                  <span className="text-gray-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-pink-400 hover:text-pink-300 transition"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-pink-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#020e1d] text-gray-400">or</span>
            </div>
          </div>

          {/* Demo Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full border border-blue-500/50 py-3 rounded-lg font-semibold text-blue-300 hover:bg-blue-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue as Demo User
          </button>

          {/* Toggle Link */}
          <p className="text-center text-sm text-gray-400 mt-8">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
              }}
              className="text-pink-400 hover:text-pink-300 transition font-semibold"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Features List */}
        <div className="mt-12 space-y-3">
          <FeatureItem icon="⚡" text="No installation required" />
          <FeatureItem icon="🔒" text="Secure authentication" />
          <FeatureItem icon="🚀" text="Instant results" />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our{" "}
            <a href="#" className="text-pink-400 hover:text-pink-300">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-pink-400 hover:text-pink-300">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition text-sm inline-flex items-center gap-2"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-950/20 border border-blue-500/10 rounded-lg">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
}
