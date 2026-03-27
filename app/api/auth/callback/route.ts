import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OAUTH_STATE_COOKIE = "ig_oauth_state";
const OAUTH_UID_COOKIE = "ig_oauth_uid";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const userId = cookieStore.get(OAUTH_UID_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);
  cookieStore.delete(OAUTH_UID_COOKIE);

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Missing authenticated user context" },
      { status: 401 }
    );
  }

  try {
    const origin = process.env.BASE_URL || req.nextUrl.origin;

    // Exchange for short-lived token
    const shortTokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID!,
          client_secret: process.env.INSTAGRAM_APP_SECRET!,
          grant_type: "authorization_code",
          redirect_uri: `${origin}/api/auth/callback`,
          code,
        }),
      }
    );

    if (!shortTokenRes.ok) {
      throw new Error("Short token exchange failed");
    }

    const shortData = await shortTokenRes.json();

    if (!shortData.access_token) {
      throw new Error("Short token exchange failed");
    }

    // Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortData.access_token}`
    );

    if (!longTokenRes.ok) {
      throw new Error("Long token exchange failed");
    }

    const longData = await longTokenRes.json();

    if (!longData.access_token) {
      throw new Error("Long token exchange failed");
    }

    const longToken = longData.access_token;
    const expiresAt = new Date(Date.now() + longData.expires_in * 1000);

    // Fetch IG account info
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${longToken}`
    );

    if (!profileRes.ok) {
      throw new Error("Failed to fetch profile");
    }

    const profile = await profileRes.json();

    if (!profile.id) {
      throw new Error("Failed to fetch profile");
    }

    // Store in Supabase
    const { error } = await supabaseAdmin.from("workspaces").insert({
      user_id: userId,
      instagram_user_id: profile.id,
      username: profile.username,
      access_token: longToken,
      token_expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;

    return NextResponse.redirect(`${origin}/onboarding`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
