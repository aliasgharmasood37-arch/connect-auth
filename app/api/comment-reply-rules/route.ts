import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

const SHORTCODE_RE = /(?:reel|p)\/([^\/\?]+)/;

function extractShortcodes(urls: string[]): string[] {
  return urls.flatMap((url) => {
    const m = SHORTCODE_RE.exec(url);
    return m ? [m[1]] : [];
  });
}

// ── GET /api/comment-reply-rules ──────────────────────────────────────────
// Returns all reply rule configurations for the authenticated user's workspace.

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

  const { data: rules, error } = await supabase
    .from("comment_reply_rules")
    .select("id,rules,applies_to,reel_urls,active,created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load reply rules" }, { status: 500 });
  }

  return NextResponse.json({ rules: rules ?? [] });
}

// ── POST /api/comment-reply-rules ─────────────────────────────────────────
// Creates a new reply rule configuration.
// Body: { alwaysMentionPrice, alwaysMentionLocation, alwaysMentionOffer,
//         customInstruction, applies_to, reel_urls }

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { applies_to, reel_urls } = body as {
    applies_to?: string;
    reel_urls?: unknown;
  };

  if (applies_to && applies_to !== "all_reels" && applies_to !== "specific_reels") {
    return NextResponse.json({ error: "Invalid applies_to value" }, { status: 400 });
  }

  if (reel_urls !== undefined && !Array.isArray(reel_urls)) {
    return NextResponse.json({ error: "reel_urls must be an array" }, { status: 400 });
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

  const reelUrls: string[] = (reel_urls as string[]) ?? [];

  const { data: rule, error } = await supabase
    .from("comment_reply_rules")
    .insert({
      workspace_id: workspace.id,
      rules: {
        always_mention_price:    body.alwaysMentionPrice    ?? "",
        always_mention_location: body.alwaysMentionLocation ?? "",
        always_mention_offer:    body.alwaysMentionOffer    ?? "",
        custom_instruction:      body.customInstruction     ?? "",
      },
      applies_to: applies_to ?? "all_reels",
      reel_urls: reelUrls,
      reel_shortcodes: extractShortcodes(reelUrls),
    })
    .select("id,rules,applies_to,reel_urls,reel_shortcodes,active,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create reply rule" }, { status: 500 });
  }

  return NextResponse.json({ rule });
}
