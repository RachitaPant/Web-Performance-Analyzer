import type { Strategy } from "@/lib/report";
import type { PsiResponse } from "./transformPageSpeed";

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];
// One deadline shared by all attempts, so retries can't push the route past Vercel Hobby's
// 60 s function limit. Cold runs on very heavy sites can exceed it, but PSI caches recent
// runs, so an immediate retry usually returns in ~10 s.
const PSI_DEADLINE_MS = 50_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export class AnalysisError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AnalysisError";
  }
}

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|0\.0\.0\.0|\[::1?\])$/i;

// Accepts "example.com" or a full URL; returns a normalized public http(s) URL.
export const normalizeUrl = (input: string): string => {
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new AnalysisError(400, "That doesn't look like a valid website URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AnalysisError(400, "Only http and https URLs can be analyzed.");
  }
  if (PRIVATE_HOST.test(parsed.hostname) || !parsed.hostname.includes(".")) {
    throw new AnalysisError(
      400,
      "Only publicly reachable websites can be analyzed — localhost and private network addresses aren't supported."
    );
  }
  return parsed.toString();
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const buildPsiUrl = (url: string, strategy: Strategy, apiKey: string) => {
  const params = new URLSearchParams({ url, strategy, key: apiKey });
  CATEGORIES.forEach((c) => params.append("category", c));
  return `${PSI_ENDPOINT}?${params}`;
};

export const fetchPageSpeed = async (
  url: string,
  strategy: Strategy
): Promise<PsiResponse> => {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) {
    throw new AnalysisError(500, "Analysis service is not configured. Please contact support.");
  }

  const deadline = AbortSignal.timeout(PSI_DEADLINE_MS);

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(buildPsiUrl(url, strategy, apiKey), { signal: deadline, cache: "no-store" });
    } catch (err) {
      if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
        throw new AnalysisError(
          504,
          "This site took too long to analyze. Please try again — Google caches recent runs, so a retry is usually much faster."
        );
      }
      throw new AnalysisError(502, "Couldn't reach Google PageSpeed Insights. Please try again.");
    }

    if (res.ok) return (await res.json()) as PsiResponse;

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * (attempt + 1));
      continue;
    }

    const body = await res.json().catch(() => null);
    const detail: string | undefined = body?.error?.message;
    console.error(`PageSpeed API ${res.status}: ${detail ?? "no detail"}`);

    switch (res.status) {
      case 400:
      case 500:
        // PSI answers 400/500 with "Lighthouse returned error: ..." when the target page fails to load.
        throw new AnalysisError(
          400,
          "We couldn't analyze that URL. Please check it's a valid, publicly accessible website."
        );
      case 429:
        throw new AnalysisError(
          429,
          "We're getting a lot of requests right now. Please wait a moment and try again."
        );
      case 403:
        throw new AnalysisError(500, "Analysis service authentication failed. Please contact support.");
      default:
        throw new AnalysisError(
          502,
          "Something went wrong while analyzing this website. Please try again in a moment."
        );
    }
  }
};
