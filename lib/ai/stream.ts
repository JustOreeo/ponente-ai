import type { StreamEvent } from "./events";

/**
 * Wrap an async iterable of StreamEvents into a Response with an SSE body.
 * The route handler returns this directly.
 */
export function streamEventsResponse(
  events: AsyncIterable<StreamEvent>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(serialize(event)));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown stream error";
        controller.enqueue(
          encoder.encode(serialize({ type: "error", message })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Serialize one event in SSE wire format. */
function serialize(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Client-side: read an SSE Response body and yield parsed events.
 * Use with `for await (const event of readEvents(response)) { ... }`.
 */
export async function* readEvents(
  response: Response,
): AsyncIterable<StreamEvent> {
  if (!response.body) {
    yield { type: "error", message: "No response body." };
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE messages are separated by blank lines.
      let sepIndex: number;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);

        // A chunk may contain multiple `data:` lines; we only emit one event
        // per chunk, so just take the first matching `data:` line.
        const line = chunk
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice("data:".length).trim();
        if (!payload) continue;
        try {
          const event = JSON.parse(payload) as StreamEvent;
          yield event;
        } catch {
          yield { type: "error", message: "Malformed event from server." };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
