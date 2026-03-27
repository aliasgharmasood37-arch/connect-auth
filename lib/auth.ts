import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type AuthResult =
  | { ok: true; userId: string; accessToken: string }
  | { ok: false; status: number; error: string };

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const [type, token] = authHeader.split(" ");
  if (!type || !token) return null;
  if (type.toLowerCase() !== "bearer") return null;
  return token;
}

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const accessToken = getBearerToken(req);

  if (!accessToken) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }

  return { ok: true, userId: data.user.id, accessToken };
}
