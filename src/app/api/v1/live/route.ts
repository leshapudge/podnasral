import { liveBroadcaster } from "@/lib/live/broadcaster";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", data: { ts: Date.now() } });

      cleanup = liveBroadcaster.subscribe((event) => send(event));

      const heartbeat = setInterval(() => {
        send({ type: "heartbeat", data: { ts: Date.now() } });
      }, 30000);

      const origCleanup = cleanup;
      cleanup = () => {
        origCleanup?.();
        clearInterval(heartbeat);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
