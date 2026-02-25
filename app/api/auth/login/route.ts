import { NextResponse } from "next/server";

export async function GET() {
  const url = new URL("https://www.instagram.com/oauth/authorize");

  url.searchParams.set("client_id", process.env.INSTAGRAM_APP_ID!);
  url.searchParams.set(
    "redirect_uri",
    `${process.env.BASE_URL}/auth/callback`
  );
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments"
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("force_reauth", "true");

  return NextResponse.redirect(url.toString());
}