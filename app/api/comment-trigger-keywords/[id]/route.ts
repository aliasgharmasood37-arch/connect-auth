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

// ── DELETE /api/comment-trigger-keywords/:id ──────────────────────────────
// Deletes a trigger keyword rule by ID.

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const { data, error } = await supabase
    .from("trigger_keywords")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// ── PATCH /api/comment-trigger-keywords/:id ───────────────────────────────
// Updates keyword, reply message, scope and reel URLs.
// Body: { keyword?, replyMessage?, scope?, reelUrls? }

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const updates: Record<string, unknown> = {};
  if (typeof body.keyword === "string") updates.keyword = body.keyword.trim();
  if (typeof body.replyMessage === "string") updates.reply_message = body.replyMessage.trim();
  if (body.scope === "all" || body.scope === "specific") updates.scope = body.scope;
  if (Array.isArray(body.reelUrls)) {
    updates.reel_urls = body.reelUrls;
    updates.reel_shortcodes = extractShortcodes(body.reelUrls as string[]);
  }
  if (typeof body.sendPrivateDm === "boolean") {
    updates.send_private_dm = body.sendPrivateDm;
    updates.private_dm_message = body.sendPrivateDm ? (body.privateDmMessage ?? "") : null;
  }

  const { data, error } = await supabase
    .from("trigger_keywords")
    .update(updates)
    .eq("id", id)
    .select("id,keyword,reply_message,scope,reel_urls,reel_shortcodes,send_private_dm,private_dm_message,active,created_at");

  if (error) {
    return NextResponse.json({ error: "Failed to update keyword" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ keyword: data[0] });
}
