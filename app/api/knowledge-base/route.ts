import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { compressKnowledgeBase } from "@/lib/compressKnowledgeBase";

// ── GET /api/knowledge-base ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { data: pb } = await supabaseAdmin
    .from("prompt_blocks")
    .select("full_knowledge_base")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  return NextResponse.json({ answers: pb?.full_knowledge_base ?? null, workspaceId: workspace.id });
}

// ── PATCH /api/knowledge-base ─────────────────────────────────────────────────
// Body: the full updated knowledge base object
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("prompt_blocks")
    .upsert({ workspace_id: workspace.id, full_knowledge_base: body }, { onConflict: "workspace_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: recompress knowledge base after update
  compressKnowledgeBase(workspace.id, body as Record<string, unknown>).catch((err) => {
    console.error("[compression] KB update compression failed:", err);
  });

  return NextResponse.json({ success: true });
}
