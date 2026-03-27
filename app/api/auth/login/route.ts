import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";

const OAUTH_STATE_COOKIE = "ig_oauth_state";
const OAUTH_UID_COOKIE = "ig_oauth_uid";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const origin = process.env.BASE_URL || req.nextUrl.origin;
  console.log("Redirect URI being sent:", `${origin}/api/auth/callback`);
  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  cookieStore.set(OAUTH_UID_COOKIE, auth.userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID!);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments"
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("force_reauth", "true");
  url.searchParams.set("state", state);

  return NextResponse.json({ url: url.toString() });
}
