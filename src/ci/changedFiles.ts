// Which of a PR's changed files can affect the deployed app's performance?
//
// Lighthouse lab runs vary a lot (the same page measured 99 and 67 within an hour), so a PR that
// changes only docs, CI or tests can still "fail" a budget on noise. Knowing that no runtime file
// changed lets CI report those numbers as informational instead of blaming the PR.
//
// Fail-safe: anything not matched below counts as a runtime change, so budgets stay enforced.
const NON_RUNTIME_PATTERNS: RegExp[] = [
  /\.md$/i,
  /^\.github\//,
  /^src\/ci\//, // CI-only code (budgets, PR comments); never imported by the app
  /^\.sitepulse\//,
  /^tests?\//,
  /^evals\//,
  /^scripts\//,
  /^docs\//,
  /^\.vscode\//,
  /^\.claude\//,
  /^LICENSE(\..*)?$/i,
  /^\.env\.example$/,
  /^\.gitignore$/,
  /^firestore\.rules$/,
  /^jest\.(config|setup)\.[cm]?[jt]s$/,
  /^eslint\.config\.[cm]?[jt]s$/,
  /^test-firebase\.cjs$/,
];

export const classifyChangedFiles = (files: string[]) => {
  const cleaned = files.map((f) => f.trim().replace(/^\.\//, "")).filter(Boolean);
  const runtime = cleaned.filter((f) => !NON_RUNTIME_PATTERNS.some((p) => p.test(f)));
  return { runtime, other: cleaned.filter((f) => !runtime.includes(f)), total: cleaned.length };
};
export type ChangedFiles = ReturnType<typeof classifyChangedFiles>;
