import type { Strategy } from "@/lib/report";
import type { PsiResponse } from "@/lib/transformPageSpeed";
import { AnalysisError, requestPageSpeed } from "@/lib/psi";

export { AnalysisError, normalizeUrl } from "@/lib/psi";

// Server-side PSI (used when no browser key is configured). One deadline shared by all attempts,
// kept under the analyze route's maxDuration. Heavy sites can exceed it (vercel.com measured
// >150 s from Vercel), which is why the browser path in lib/clientAnalysis.ts is preferred.
const PSI_DEADLINE_MS = 150_000;

export const fetchPageSpeed = async (url: string, strategy: Strategy): Promise<PsiResponse> => {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    throw new AnalysisError(500, "Analysis service is not configured. Please contact support.");
  }
  return requestPageSpeed(url, strategy, apiKey, PSI_DEADLINE_MS);
};
