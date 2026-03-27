import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function parseSignedRequest(signedRequest: string): Record<string, unknown> | null {
  const parts = signedRequest.split(".");
  if (parts.length !== 2) return null;

  const [encodedSig, payload] = parts;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;

  // Verify HMAC-SHA256 signature
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

  // Null out the access token rather than deleting the workspace row so other
  // data (settings, stats) remains intact. The user can reconnect later.
  const { error } = await supabaseAdmin
    .from("workspaces")
    .update({ access_token: null, token_expires_at: null })
    .eq("instagram_user_id", instagramUserId);

  if (error) {
    console.error("[deauthorize] Supabase error:", error.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  console.log(`[deauthorize] Revoked token for instagram_user_id=${instagramUserId}`);
  return NextResponse.json({ success: true });
}
