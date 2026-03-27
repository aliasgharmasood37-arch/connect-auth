import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

// ── Compression system prompt ────────────────────────────────────────────────
const COMPRESSION_PROMPT = `You are a knowledge base compression engine. Your job is to take a structured JSON knowledge base for a service-based business and compress each section into a tight, natural-language paragraph optimized for LLM context injection.

Rules:
- Each block must be a single paragraph, no bullet points, no labels, no JSON keys.
- Write in plain natural language as if briefing someone in 2-3 sentences per block.
- Keep every fact, number, price, phone number, and link — do not drop any data.
- Do not add information that isn't in the source JSON.
- Do not use filler phrases like "the business offers" or "customers can expect" — just state the facts directly.
- Keep each block as short as possible while retaining all information.
- If a field is empty or blank in the JSON, skip it — do not mention it.

Return your response as a JSON object with exactly these 8 keys:
{
  "c_identity": "...",
  "c_services": "...",
  "c_trust": "...",
  "c_contact_logistics": "...",
  "c_customer_profile": "...",
  "c_agent_behavior": "...",
  "c_guardrails": "...",
  "c_lead_capture": "..."
}

Here is which sections of the knowledge base map to which key:

c_identity → compress the "identity" section. Include: business name, owner, handle, type, location, hours, description, what they don't offer, years in business, social proof, portfolio post links, contact numbers, WhatsApp link, maps link, and primary CTA.

c_services → compress the "services" section. Include: full catalogue with prices, options/variants, custom request policy, how the service works, turnaround time, what pricing depends on, free consultation info, and payment plan info.

c_trust → compress the "trust_and_guarantee" section. Include: guarantee, how long results last, aftercare tips, common customer worries, and how the business handles those worries.

c_contact_logistics → compress the "contact_and_logistics" section. Include: WhatsApp, phone, website, maps link, payment methods, booking methods, service area, and cancellation policy.

c_customer_profile → compress the "customer_profile" section. Include: who the typical customers are, their experience level, and the most common questions they ask.

c_agent_behavior → compress the "agent_behavior" section. Include: primary goal, what to qualify before pushing CTA, when to push CTA, greeting message, tone, languages, phrases to use or avoid. Also include: never reveal you're automated, 1-3 lines max per reply, answer first then one follow-up, if not interested leave door open warmly.

c_guardrails → compress the "agent_behavior.never_do" and "agent_behavior.fallback_response" fields. Include: all things the agent must never do, the fallback response when it doesn't know something, use fallback max once per conversation, and how to handle when customers reference Instagram posts/reels.

c_lead_capture → compress the "lead_capture" section. Include: what info to collect, when to ask, what to do if refused, and the custom flow description. Also include: if customer volunteers info early capture it immediately, inquiry is derived from conversation never ask to summarize, capture once only, never mention info is stored.

Return ONLY the JSON object. No markdown, no backticks, no preamble.`;

// ── Types ────────────────────────────────────────────────────────────────────
type CompressedBlocks = {
  c_identity: string;
  c_services: string;
  c_trust: string;
  c_contact_logistics: string;
  c_customer_profile: string;
  c_agent_behavior: string;
  c_guardrails: string;
  c_lead_capture: string;
};

// ── OpenRouter call (with one auto-retry on 429/502/503) ─────────────────────
async function callOpenRouter(
  apiKey: string,
  answers: Record<string, unknown>,
  attempt = 1
): Promise<CompressedBlocks | null> {
  const siteUrl = process.env.BASE_URL ?? "https://instautomate.app";

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "InstaAutomate",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: COMPRESSION_PROMPT },
          {
            role: "user",
            content: `Compress this knowledge base:\n\n${JSON.stringify(answers, null, 2)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
  } catch (err) {
    console.error("[compression] Network error calling OpenRouter:", err);
    return null;
  }

  if (!res.ok) {
    const status = res.status;
    if (status === 401) {
      console.error("[compression] OpenRouter: Invalid API key (401) — check OPENROUTER_API_KEY");
      return null; // non-retriable
    }
    if ((status === 429 || status === 502 || status === 503) && attempt === 1) {
      console.warn(`[compression] OpenRouter: status ${status}, retrying in 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
      return callOpenRouter(apiKey, answers, 2);
    }
    console.error(`[compression] OpenRouter: Unexpected status ${status}`);
    return null;
  }

  try {
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty content in OpenRouter response");
    return JSON.parse(raw) as CompressedBlocks;
  } catch (err) {
    console.error("[compression] Failed to parse OpenRouter response:", err);
    return null;
  }
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function compressKnowledgeBase(
  workspaceId: string,
  onboardingAnswers: Record<string, unknown>
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[compression] OPENROUTER_API_KEY is not set");
    return;
  }

  const blocks = await callOpenRouter(apiKey, onboardingAnswers);
  if (!blocks) {
    console.error(`[compression] Compression failed for workspace ${workspaceId}`);
    return;
  }

  const { error } = await supabaseAdmin.from("prompt_blocks").upsert(
    {
      workspace_id: workspaceId,
      c_identity: blocks.c_identity ?? "",
      c_services: blocks.c_services ?? "",
      c_trust: blocks.c_trust ?? "",
      c_contact_logistics: blocks.c_contact_logistics ?? "",
      c_customer_profile: blocks.c_customer_profile ?? "",
      c_agent_behavior: blocks.c_agent_behavior ?? "",
      c_guardrails: blocks.c_guardrails ?? "",
      c_lead_capture: blocks.c_lead_capture ?? "",
    },
    { onConflict: "workspace_id" }
  );

  if (error) {
    console.error("[compression] Failed to upsert prompt_blocks:", error.message);
    return;
  }

  console.log(`[compression] prompt_blocks updated for workspace ${workspaceId}`);
}
