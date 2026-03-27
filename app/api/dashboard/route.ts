import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSupabaseServerClientWithAuth } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseServerClientWithAuth(auth.accessToken);

  const [accountQuery, statsQuery] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id,instagram_user_id,username,token_expires_at,is_ai_configured,dm_active,comment_active,temp_instructions_active,temp_instructions,temp_instructions_expires_at,created_at")
      .eq("user_id", auth.userId)
      .limit(1),
    supabase
      .from("stats")
      .select("dms_handled,comments_replied,response_rate")
      .eq("user_id", auth.userId)
      .maybeSingle(),
  ]);

  if (accountQuery.error) {
    return NextResponse.json(
      { error: "Failed to load workspace data" },
      { status: 500 }
    );
  }

  const account = accountQuery.data?.[0] ?? null;

  let missingReelCount = 0;
  let leadsCount = 0;
  let dmLastActive: string | null = null;
  let commentLastActive: string | null = null;
  if (account) {
    const [reelRes, leadsRes, dmRes, commentRes] = await Promise.all([
      supabase
        .from("reel_context")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", account.id)
        .eq("has_context", false),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", account.id),
      supabase
        .from("leads")
        .select("created_at")
        .eq("workspace_id", account.id)
        .eq("source", "dm")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("leads")
        .select("created_at")
        .eq("workspace_id", account.id)
        .eq("source", "comment")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    missingReelCount = reelRes.count ?? 0;
    leadsCount = leadsRes.count ?? 0;
    dmLastActive = dmRes.data?.created_at ?? null;
    commentLastActive = commentRes.data?.created_at ?? null;
  }

  return NextResponse.json({
    connected: account !== null,
    isConfigured: account?.is_ai_configured ?? false,
    account,
    automation: { dm_active: account?.dm_active ?? false, comment_active: account?.comment_active ?? false },
    tempInstructionsActive: account?.temp_instructions_active ?? false,
    tempInstructions: account?.temp_instructions ?? "",
    tempInstructionsExpiresAt: account?.temp_instructions_expires_at ?? null,
    missingReelCount,
    leadsCount,
    dmLastActive,
    commentLastActive,
    stats: statsQuery.error ? { dms_handled: 0, comments_replied: 0, response_rate: 0 } : (statsQuery.data ?? { dms_handled: 0, comments_replied: 0, response_rate: 0 }),
  });
}
