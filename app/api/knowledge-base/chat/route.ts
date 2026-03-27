import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const KB_ASSISTANT_SYSTEM = `You are a knowledge base optimization assistant for an Instagram DM automation tool. The business owner will ask you questions about their AI agent's performance or their knowledge base.

Your job:
- Read their current knowledge base and identify gaps, issues, or improvements
- Give specific, actionable suggestions — tell them exactly which field to change and what to write
- Keep explanations simple and non-technical — these are small business owners, not developers
- When they agree to a change, output the exact field name and new value so the system can apply it
- Be concise — 2-3 lines per suggestion max

When suggesting changes, respond with a JSON block at the end:
{"field": "identity.description", "action": "update", "value": "..."}

Only include the JSON block when you're making a specific change the user has agreed to. For general advice, just respond normally.

Current knowledge base:
`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { message, history = [], onboardingAnswers } = body as {
    message: string;
    history: ChatMessage[];
    onboardingAnswers: Record<string, unknown>;
  };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  const systemPrompt = `${KB_ASSISTANT_SYSTEM}${JSON.stringify(onboardingAnswers, null, 2)}`;

  let aiRes: Response;
  try {
    aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.BASE_URL ?? "",
        "X-Title": "InstaAutomate",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });
  } catch (err) {
    console.error("[kb-chat] Network error:", err);
    return NextResponse.json({ error: "AI call failed" }, { status: 500 });
  }

  if (!aiRes.ok) {
    console.error("[kb-chat] OpenRouter error:", aiRes.status);
    return NextResponse.json({ error: "AI call failed" }, { status: 500 });
  }

  const data = await aiRes.json();
  const fullReply: string = data.choices?.[0]?.message?.content ?? "";

  // Extract field update JSON block if present
  let fieldUpdate: { field: string; action: string; value: unknown } | null = null;
  const jsonMatch = fullReply.match(/\{[^{}]*"field"\s*:\s*"[^"]+"\s*,[^{}]*\}/);
  if (jsonMatch) {
    try {
      fieldUpdate = JSON.parse(jsonMatch[0]);
    } catch {}
  }

  const displayReply = fieldUpdate
    ? fullReply.replace(jsonMatch![0], "").replace(/\n{3,}/g, "\n\n").trim()
    : fullReply;

  return NextResponse.json({ reply: displayReply, fieldUpdate });
}
