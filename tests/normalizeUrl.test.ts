/** @jest-environment node */
import { AnalysisError, normalizeUrl } from "@/server/pagespeed";

describe("normalizeUrl", () => {
  test.each([
    ["example.com", "https://example.com/"],
    ["https://example.com/path?q=1", "https://example.com/path?q=1"],
    ["  http://example.com  ".trim(), "http://example.com/"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  test.each([
    "ftp://example.com",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://192.168.1.10",
    "http://10.0.0.5",
    "http://169.254.169.254/latest/meta-data",
    "http://intranet",
    "not a url",
  ])("rejects %s", (input) => {
    expect(() => normalizeUrl(input)).toThrow(AnalysisError);
  });
});
