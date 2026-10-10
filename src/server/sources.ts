// An expected, non-fatal gap in an optional data source (API not enabled, no data for this site).
// Reported to the UI as "unavailable" rather than "error".
export class SourceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceUnavailableError";
  }
}

export const OPTIONAL_SOURCE_TIMEOUT_MS = 15_000;
