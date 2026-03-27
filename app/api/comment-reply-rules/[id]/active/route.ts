import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

// ── PATCH /api/comment-reply-rules/:id/active ─────────────────────────────
// Toggles the active state of a reply rule.
// Body: { active: boolean }

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
  if (!body || typeof body.active !== "boolean") {
    return NextResponse.json(
      { error: "Invalid payload: active (boolean) required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const { data, error } = await supabase
    .from("comment_reply_rules")
    .update({ active: body.active })
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to update reply rule" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
