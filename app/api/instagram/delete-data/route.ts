import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function parseSignedRequest(signedRequest: string): Record<string, unknown> | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;

  const [encodedSig, payload] = parts;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;

  const expected = createHmac("sha256", appSecret)
    .update(payload)
    .digest();

  const received = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  let signedRequest: string | null = null;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    signedRequest = new URLSearchParams(text).get("signed_request");
  } else {
    const body = await req.json().catch(() => null);
    signedRequest = body?.signed_request ?? null;
  }

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const data = parseSignedRequest(signedRequest);
  if (!data) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 403 });
  }

  const instagramUserId = data.user_id as string | undefined;
  if (!instagramUserId) {
    return NextResponse.json({ error: "Missing user_id in payload" }, { status: 400 });
  }

  // Look up the workspace to find the app user_id
  const { data: workspace, error: lookupError } = await supabaseAdmin
    .from("workspaces")
    .select("user_id")
    .eq("instagram_user_id", instagramUserId)
    .maybeSingle();

  if (lookupError) {
    console.error("[delete-data] Lookup error:", lookupError.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (workspace) {
    const userId = workspace.user_id;

    // Delete all user data across every table
    await Promise.all([
      supabaseAdmin.from("workspaces").delete().eq("user_id", userId),
      supabaseAdmin.from("stats").delete().eq("user_id", userId),
    ]);

    console.log(`[delete-data] Deleted all data for instagram_user_id=${instagramUserId} (user_id=${userId})`);
  } else {
    console.log(`[delete-data] No data found for instagram_user_id=${instagramUserId}`);
  }

  const confirmationCode = randomUUID();
  const baseUrl = process.env.BASE_URL ?? req.nextUrl.origin;

  // Meta requires this exact shape in the response
  return NextResponse.json({
    url: `${baseUrl}/api/instagram/delete-data/status?id=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
