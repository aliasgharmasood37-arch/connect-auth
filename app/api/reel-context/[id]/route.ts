import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

// ── PATCH /api/reel-context/:id ───────────────────────────────────────────────
// Updates the context text of a reel entry.
// Body: { context }

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
  if (!body || typeof body.context !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const { data, error } = await supabase
    .from("reel_context")
    .update({ context: body.context.trim(), has_context: true })
    .eq("id", id)
    .select("id,url,shortcode,context,created_at");

  if (error) {
    return NextResponse.json({ error: "Failed to update reel" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ reel: data[0] });
}

// ── DELETE /api/reel-context/:id ──────────────────────────────────────────────
// Deletes a reel context entry.

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
    .from("reel_context")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to delete reel" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
