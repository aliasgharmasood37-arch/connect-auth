import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
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
          redirect_uri: `${process.env.BASE_URL}/api/auth/callback`,
          code,
        }),
      }
    );

    const shortData = await shortTokenRes.json();

    if (!shortData.access_token) {
      throw new Error("Short token exchange failed");
    }

    // Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortData.access_token}`
    );

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

    const profile = await profileRes.json();

    if (!profile.id) {
      throw new Error("Failed to fetch profile");
    }

    // Store in Supabase
    const { error } = await supabaseAdmin.from("workspaces").insert({
      instagram_user_id: profile.id,
      username: profile.username,
      access_token: longToken,
      token_expires_at: expiresAt,
      demo_mode: true,
      ai_status: "active",
    });

    if (error) throw error;

    return NextResponse.redirect(
      `${process.env.BASE_URL}/dashboard?connected=true`
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Auth failed" },
      { status: 500 }
    );
  }
}