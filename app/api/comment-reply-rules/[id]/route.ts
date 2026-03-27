import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

// ── DELETE /api/comment-reply-rules/:id ───────────────────────────────────
// Deletes a reply rule by ID.

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
    .from("comment_reply_rules")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to delete reply rule" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
