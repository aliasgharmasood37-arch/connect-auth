import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const update: Record<string, unknown> = { temp_instructions_active: body.active };
  if (typeof body.instruction === "string") {
    update.temp_instructions = body.instruction;
  }
  if ("expiresAt" in body) {
    update.temp_instructions_expires_at = body.expiresAt ?? null;
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);
  const { error } = await supabase
    .from("workspaces")
    .update(update)
    .eq("user_id", auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
