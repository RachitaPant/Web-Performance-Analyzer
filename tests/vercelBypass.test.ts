/** @jest-environment node */
import { landedOnDifferentSite, redactSecret, stripAuditParams, withBypass, withRunParam } from "@/ci/vercelBypass";

const SECRET = "s3cr3t-bypass-value-1234567890abcd";
const PREVIEW = "https://app-git-feature-team.vercel.app/login?ref=pr";

test("adds the bypass params only when a secret is configured", () => {
  const url = new URL(withBypass(PREVIEW, SECRET));
  expect(url.searchParams.get("x-vercel-protection-bypass")).toBe(SECRET);
  expect(url.searchParams.get("x-vercel-set-bypass-cookie")).toBe("true");
  expect(url.searchParams.get("ref")).toBe("pr");
  expect(withBypass(PREVIEW, null)).toBe(PREVIEW);
});

test("stripping restores the original URL, so reports never show the secret or run param", () => {
  expect(stripAuditParams(withRunParam(withBypass(PREVIEW, SECRET), "abc-0"))).toBe(PREVIEW);
  expect(stripAuditParams("not a url")).toBe("not a url");
});

test("each run gets a distinct URL so PSI can't serve a cached run", () => {
  const a = withRunParam(PREVIEW, "k1-0");
  const b = withRunParam(PREVIEW, "k1-1");
  expect(a).not.toBe(b);
  expect(new URL(a).searchParams.get("ref")).toBe("pr");
});

test("redaction removes every occurrence, including URL-embedded and JSON-escaped ones", () => {
  const leaked = JSON.stringify({ finalUrl: withBypass(PREVIEW, SECRET), note: `token ${SECRET} twice ${SECRET}` });
  const clean = redactSecret(leaked, SECRET);
  expect(clean).not.toContain(SECRET);
  expect(clean.match(/\*\*\*/g)).toHaveLength(3);
  expect(redactSecret(leaked, null)).toBe(leaked);
});

test("detects when an audit ended up on another site (e.g. a login redirect)", () => {
  expect(landedOnDifferentSite("https://app-abc.vercel.app/", "https://vercel.com/login?next=x")).toBe(true);
  expect(landedOnDifferentSite("https://example.com/", "https://www.example.com/")).toBe(false);
  expect(landedOnDifferentSite("https://www.example.com/a", "https://example.com/b")).toBe(false);
  expect(landedOnDifferentSite("https://example.com/", "not a url")).toBe(false);
});
