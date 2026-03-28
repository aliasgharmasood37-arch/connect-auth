import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

const SHORTCODE_RE = /(?:reel|p)\/([^\/\?]+)/;
const INSTAGRAM_URL_RE = /^https:\/\/(www\.)?instagram\.com\//;

function extractShortcodes(urls: string[]): string[] {
  return urls.flatMap((url) => {
    const m = SHORTCODE_RE.exec(url);
    return m ? [m[1]] : [];
  });
}

function validateReelUrls(urls: string[]): boolean {
  return urls.every((url) => typeof url === "string" && INSTAGRAM_URL_RE.test(url));
}

// ── GET /api/comment-trigger-keywords ─────────────────────────────────────
// Returns all trigger keyword rules for the authenticated user's workspace.

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

  const { data: keywords, error } = await supabase
    .from("trigger_keywords")
    .select("id,keyword,reply_message,scope,reel_urls,reel_shortcodes,send_private_dm,private_dm_message,active,created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load keywords" }, { status: 500 });
  }

  return NextResponse.json({ keywords: keywords ?? [] });
}

// ── POST /api/comment-trigger-keywords ────────────────────────────────────
// Creates a new trigger keyword rule.
// Body: { keyword, replyMessage, scope, reelUrls, active }

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.keyword !== "string" ||
    typeof body.replyMessage !== "string"
  ) {
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

  const reelUrls: string[] = Array.isArray(body.reelUrls) ? body.reelUrls : [];
  if (reelUrls.length > 0 && !validateReelUrls(reelUrls)) {
    return NextResponse.json({ error: "Invalid reel URL" }, { status: 400 });
  }

  const { data: keyword, error } = await supabase
    .from("trigger_keywords")
    .insert({
      workspace_id: workspace.id,
      keyword: body.keyword.trim(),
      reply_message: body.replyMessage.trim(),
      scope: body.scope ?? "all",
      reel_urls: reelUrls,
      reel_shortcodes: extractShortcodes(reelUrls),
      send_private_dm: body.sendPrivateDm ?? false,
      private_dm_message: body.sendPrivateDm ? (body.privateDmMessage ?? "") : null,
      active: body.active ?? true,
    })
    .select("id,keyword,reply_message,scope,reel_urls,reel_shortcodes,send_private_dm,private_dm_message,active,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create keyword" }, { status: 500 });
  }

  return NextResponse.json({ keyword });
}
