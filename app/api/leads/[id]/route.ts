import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

const VALID_STATUSES = ["new", "contacted", "converted", "lost"] as const;

// ── PATCH /api/leads/:id ──────────────────────────────────────────────────
// Updates a lead's status. Verifies ownership via workspace_id before updating.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  // Resolve workspace to enforce ownership
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("leads")
    .update({ status: body.status })
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ lead: data });
}
