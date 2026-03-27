import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ── GET /api/comment-config ───────────────────────────────────────────────────
// Primary source: prompt_blocks.comment_config
// Migration: if prompt_blocks has no config but workspaces does, copies it over.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);
  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .select("id,comment_config")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { data: pb } = await supabaseAdmin
    .from("prompt_blocks")
    .select("comment_config")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  // Migration: copy from workspaces → prompt_blocks if not yet moved
  if (!pb?.comment_config && workspace.comment_config) {
    await supabaseAdmin
      .from("prompt_blocks")
      .upsert(
        { workspace_id: workspace.id, comment_config: workspace.comment_config },
        { onConflict: "workspace_id" }
      );
    return NextResponse.json({ config: workspace.comment_config });
  }

  return NextResponse.json({ config: pb?.comment_config ?? null });
}

// ── PATCH /api/comment-config ─────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.reply_style !== "string" ||
    typeof body.dm_push_message !== "string" ||
    typeof body.reply_to !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const config = {
    reply_style: body.reply_style,
    dm_push_message: body.dm_push_message,
    reply_to: body.reply_to,
    positive_handling: typeof body.positive_handling === "string" ? body.positive_handling : "thank_and_engage",
    negative_handling: typeof body.negative_handling === "string" ? body.negative_handling : "address_politely",
  };

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { error } = await supabaseAdmin
    .from("prompt_blocks")
    .upsert({ workspace_id: workspace.id, comment_config: config }, { onConflict: "workspace_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
