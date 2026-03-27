export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { waitForReply } from "@/lib/testDmStore";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // 10 requests per minute per user
  if (!checkRateLimit(`test-dm:${auth.userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (wsError || !workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const { data: pb } = await supabaseAdmin
    .from("prompt_blocks")
    .select("full_knowledge_base")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const webhookUrl = process.env.N8N_DM_TEST_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_DM_TEST_WEBHOOK_URL is not configured" },
      { status: 503 }
    );
  }

  const requestId = randomUUID();

  // Fire the n8n webhook — do NOT await a response from n8n here.
  // n8n will POST the reply to /api/ai/test-dm/respond.
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId,
      userId: auth.userId,
      message: body.message.trim(),
      knowledge: pb?.full_knowledge_base ?? {},
    }),
  }).catch(() => {
    // If the fire-and-forget fails the waitForReply timeout will handle it
  });

  // Hold this HTTP connection open until n8n calls back (max 25 s)
  const reply = await waitForReply(requestId);

  if (!reply) {
    return NextResponse.json(
      { error: "No response from AI agent. Check your n8n workflow." },
      { status: 504 }
    );
  }

  return NextResponse.json({ reply });
}
