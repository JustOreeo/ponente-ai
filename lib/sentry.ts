/**
 * Lightweight Sentry wrapper.
 *
 * We don't depend on @sentry/nextjs (heavy SDK with its own webpack plugin
 * and source-map upload pipeline). Instead, this is a tiny client that POSTs
 * structured error events to Sentry's HTTP envelope endpoint when SENTRY_DSN
 * is set. No-ops when the DSN is empty so dev iteration doesn't need it.
 *
 * Use:
 *   import { captureException } from "@/lib/sentry";
 *   try { ... } catch (err) { captureException(err, { route: "/api/foo" }); throw err; }
 */

const DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT =
  process.env.SENTRY_ENVIRONMENT ||
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.NODE_ENV ||
  "development";
const RELEASE =
  process.env.SENTRY_RELEASE ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  undefined;

type DsnParts = {
  endpoint: string; // https://oXXXXX.ingest.sentry.io/api/PROJECT_ID/envelope/
  publicKey: string;
};

let parsedDsn: DsnParts | null | undefined;

function parseDsn(dsn: string | undefined): DsnParts | null {
  if (!dsn) return null;
  // Sentry DSN: https://<publicKey>@<host>/<projectId>
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "");
    if (!u.username || !projectId) return null;
    const endpoint = `${u.protocol}//${u.host}/api/${projectId}/envelope/`;
    return { endpoint, publicKey: u.username };
  } catch {
    return null;
  }
}

function getDsn(): DsnParts | null {
  if (parsedDsn !== undefined) return parsedDsn;
  parsedDsn = parseDsn(DSN);
  return parsedDsn;
}

export type CaptureContext = {
  /** Free-form tags (low-cardinality recommended). */
  tags?: Record<string, string | number | boolean>;
  /** Free-form extras (any JSON value). */
  extras?: Record<string, unknown>;
  /** Identify the user. */
  user?: { id?: string; email?: string };
  /** Override level. Default: "error". */
  level?: "fatal" | "error" | "warning" | "info" | "debug";
};

function uuid(): string {
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function captureException(
  err: unknown,
  context: CaptureContext = {},
): void {
  const dsn = getDsn();
  if (!dsn) return;

  const eventId = uuid();
  const isError = err instanceof Error;
  const message = isError ? err.message : String(err);
  const stack = isError ? err.stack : undefined;
  const type = isError ? err.constructor.name : "Error";

  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "node",
    level: context.level ?? "error",
    environment: ENVIRONMENT,
    release: RELEASE,
    server_name: process.env.VERCEL_REGION || undefined,
    tags: context.tags,
    extra: context.extras,
    user: context.user,
    exception: {
      values: [
        {
          type,
          value: message,
          stacktrace: stack
            ? {
                frames: parseStack(stack),
              }
            : undefined,
        },
      ],
    },
  };

  const envelope = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  // Fire-and-forget. We don't want logging to block request handling.
  void fetch(dsn.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": [
        "Sentry sentry_version=7",
        `sentry_client=ponente-lite/0.1`,
        "sentry_timestamp=" + Math.floor(Date.now() / 1000),
        "sentry_key=" + dsn.publicKey,
      ].join(", "),
    },
    body: envelope,
    // Don't keep the connection open in serverless — fire and forget.
    keepalive: true,
  }).catch(() => {
    // Silent: if Sentry is down, the request shouldn't fail because of it.
  });
}

export function captureMessage(
  message: string,
  context: CaptureContext = {},
): void {
  captureException(new Error(message), { ...context, level: context.level ?? "info" });
}

function parseStack(stack: string): Array<{
  filename: string;
  function: string;
  lineno?: number;
  colno?: number;
  in_app: boolean;
}> {
  const out: Array<{
    filename: string;
    function: string;
    lineno?: number;
    colno?: number;
    in_app: boolean;
  }> = [];
  // Take lines like "    at functionName (file:line:col)"
  const lines = stack.split("\n").slice(1);
  for (const line of lines) {
    const m = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)\s*$/);
    if (m) {
      out.push({
        function: m[1],
        filename: m[2],
        lineno: Number(m[3]),
        colno: Number(m[4]),
        in_app: !m[2].includes("node_modules"),
      });
      continue;
    }
    // anonymous: "    at file:line:col"
    const m2 = line.match(/^\s*at\s+(.+?):(\d+):(\d+)\s*$/);
    if (m2) {
      out.push({
        function: "<anonymous>",
        filename: m2[1],
        lineno: Number(m2[2]),
        colno: Number(m2[3]),
        in_app: !m2[1].includes("node_modules"),
      });
    }
  }
  // Sentry expects frames in reverse order (oldest first).
  return out.reverse();
}

export function isSentryEnabled(): boolean {
  return getDsn() !== null;
}
