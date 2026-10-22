// Vercel "Protection Bypass for Automation": lets CI audit login-protected preview deployments.
// Google PageSpeed fetches the page itself, so the secret has to travel in the URL. Everything
// derived from that fetch must have it removed before being printed, commented or uploaded.

// Also removes SitePulse's own per-run cache-buster (see withRunParam).
const AUDIT_PARAMS = ["x-vercel-protection-bypass", "x-vercel-set-bypass-cookie", "sitepulse_run"];

export const withBypass = (url: string, secret: string | null) => {
  if (!secret) return url;
  const u = new URL(url);
  u.searchParams.set("x-vercel-protection-bypass", secret);
  // Sets a cookie on the first response so the page's own subrequests are allowed too.
  u.searchParams.set("x-vercel-set-bypass-cookie", "true");
  return u.toString();
};

// PSI serves cached results for a URL it has just audited, so repeated runs of the same URL
// return the same run. A unique, inert query param makes each run a real, independent one.
export const withRunParam = (url: string, runId: string) => {
  const u = new URL(url);
  u.searchParams.set("sitepulse_run", runId);
  return u.toString();
};

export const stripAuditParams = (url: string) => {
  try {
    const u = new URL(url);
    AUDIT_PARAMS.forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
};

// Last line of defense for any text leaving the process.
export const redactSecret = (text: string, secret: string | null) =>
  secret ? text.split(secret).join("***") : text;

// Did the audited page end up on a different site than requested? (e.g. a protected deployment
// redirecting to Vercel's sign-in page — CI once measured that page instead of the app.)
// A www/non-www redirect within the same site is fine.
export const landedOnDifferentSite = (requestedUrl: string, finalUrl: string) => {
  const host = (u: string) => new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  try {
    return host(requestedUrl) !== host(finalUrl);
  } catch {
    return false;
  }
};
