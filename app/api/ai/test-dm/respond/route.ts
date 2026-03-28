import { NextRequest, NextResponse } from "next/server";
import { resolveReply } from "@/lib/testDmStore";

/**
 * n8n calls this endpoint (via HTTP Request node) to deliver the AI reply.
 *
 * Expected body: { "requestId": "...", "reply": "..." }
 * Expected header: "x-webhook-secret: <N8N_WEBHOOK_SECRET>"
 */
export async function POST(req: NextRequest) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook endpoint not configured" }, { status: 503 });
  }
  const incoming = req.headers.get("x-webhook-secret");
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.requestId !== "string" ||
    typeof body.reply !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const resolved = resolveReply(body.requestId, body.reply);

  if (!resolved) {
    // requestId not found — already timed out or never created
    return NextResponse.json({ error: "Unknown or expired requestId" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
