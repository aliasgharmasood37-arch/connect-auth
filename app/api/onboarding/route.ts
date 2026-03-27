import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { compressKnowledgeBase } from "@/lib/compressKnowledgeBase";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  // Confirm workspace exists for this user before updating
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ is_ai_configured: true })
    .eq("user_id", auth.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Separate comment_config from the knowledge base payload
  const { comment_config, ...knowledgeBase } = body as Record<string, unknown>;

  const { error: pbError } = await supabaseAdmin
    .from("prompt_blocks")
    .upsert({ workspace_id: workspace.id, full_knowledge_base: knowledgeBase }, { onConflict: "workspace_id" });

  if (pbError) {
    return NextResponse.json({ error: pbError.message }, { status: 500 });
  }

  // Save comment_config to prompt_blocks if provided (Step 8 of onboarding)
  if (comment_config && typeof comment_config === "object" && !Array.isArray(comment_config)) {
    await supabaseAdmin
      .from("prompt_blocks")
      .upsert({ workspace_id: workspace.id, comment_config }, { onConflict: "workspace_id" });
  }

  // Fire-and-forget: compress knowledge base into prompt_blocks in background.
  // Does not block the response — errors are logged but never surfaced to the client.
  compressKnowledgeBase(workspace.id, knowledgeBase as Record<string, unknown>).catch((err) => {
    console.error("[compression] Unhandled error in background compression:", err);
  });

  return NextResponse.json({ success: true });
}
