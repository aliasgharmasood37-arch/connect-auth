import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ── GET /api/leads ─────────────────────────────────────────────────────────
// Returns leads + the workspace's lead-capture collect_info config.

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, username, inquiry_summary, lead_score, captured_data, source, status, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract collect_info from knowledge base for dynamic columns
  const { data: pb } = await supabaseAdmin
    .from("prompt_blocks")
    .select("full_knowledge_base")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const answers = pb?.full_knowledge_base as Record<string, unknown> | null;
  const collectInfo: string[] =
    (answers?.lead_capture as Record<string, unknown> | undefined)?.collect_info as string[] ?? [];

  return NextResponse.json({ leads: leads ?? [], collectInfo });
}

// ── POST /api/leads ────────────────────────────────────────────────────────
// Inserts a new lead. Called by n8n automation.
// Secured via N8N_LEADS_SECRET env var (x-leads-secret header).

export async function POST(req: NextRequest) {
  const secret = process.env.N8N_LEADS_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Leads endpoint not configured" }, { status: 503 });
  }
  const incoming = req.headers.get("x-leads-secret");
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body.workspace_id !== "string" ||
    typeof body.username !== "string" ||
    typeof body.inquiry_summary !== "string" ||
    typeof body.message !== "string" ||
    typeof body.lead_score !== "number"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("leads").insert({
    workspace_id: body.workspace_id,
    username: body.username,
    inquiry_summary: body.inquiry_summary,
    message: body.message,
    lead_score: body.lead_score,
    captured_data: body.captured_data ?? {},
    source: body.source ?? "dm",
    status: body.status ?? "new",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
