import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

const SHORTCODE_RE = /(?:reel|p)\/([^\/\?]+)/;

function extractShortcode(url: string): string | null {
  const m = SHORTCODE_RE.exec(url);
  return m ? m[1] : null;
}

// ── GET /api/reel-context ─────────────────────────────────────────────────────
// ?missing=true  → reels with has_context = false, sorted by mention_count DESC
// (default)      → reels with context IS NOT NULL, sorted by created_at DESC

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const missing = new URL(req.url).searchParams.get("missing") === "true";

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (missing) {
    const since = new URL(req.url).searchParams.get("since");

    let query = supabase
      .from("reel_context")
      .select("id,url,mention_count,last_mentioned_at")
      .eq("workspace_id", workspace.id)
      .eq("has_context", false);

    if (since) {
      query = query.gte("last_mentioned_at", since);
    }

    const { data: reels, error } = await query
      .order("mention_count", { ascending: false })
      .order("last_mentioned_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Failed to load reels" }, { status: 500 });
    return NextResponse.json({ reels: reels ?? [] });
  }

  const { data: reels, error } = await supabase
    .from("reel_context")
    .select("id,url,shortcode,context,created_at")
    .eq("workspace_id", workspace.id)
    .not("context", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load reels" }, { status: 500 });
  }

  return NextResponse.json({ reels: reels ?? [] });
}

// ── POST /api/reel-context ────────────────────────────────────────────────────
// Creates a new reel context entry.
// Body: { url, context }

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.url !== "string" || typeof body.context !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const trimmedUrl = body.url.trim();

  const { data: reel, error } = await supabase
    .from("reel_context")
    .insert({
      workspace_id: workspace.id,
      url: trimmedUrl,
      shortcode: extractShortcode(trimmedUrl),
      context: body.context.trim(),
      has_context: true,
    })
    .select("id,url,shortcode,context,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create reel" }, { status: 500 });
  }

  return NextResponse.json({ reel });
}
