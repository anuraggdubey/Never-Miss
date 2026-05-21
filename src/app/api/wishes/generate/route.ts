import { NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const TOKENROUTER_API_URL = "https://api.tokenrouter.io/v1/responses";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || process.env.TOKENROUTER_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

type WishRequest = {
  name?: string;
  occasion?: string;
  relation?: string;
  note?: string;
  details?: string;
  tone?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  output?: Array<{
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
  message?: string;
  error?: {
    message?: string;
  };
};

function getProviderConfig() {
  const tokenRouterKey = process.env.TOKENROUTER_API_KEY;
  if (tokenRouterKey) {
    return { apiKey: tokenRouterKey, apiUrl: TOKENROUTER_API_URL, provider: "TokenRouter" };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return { apiKey: openRouterKey, apiUrl: OPENROUTER_API_URL, provider: "OpenRouter" };
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return { apiKey: openAiKey, apiUrl: OPENAI_API_URL, provider: "OpenAI" };
  }

  return null;
}

function extractMessage(data: ChatCompletionResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputText = (data.output ?? [])
    .flatMap((part) => part.content ?? [])
    .map((part) => typeof part?.text === "string" ? part.text : "")
    .join("")
    .trim();

  if (outputText) {
    return outputText;
  }

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => typeof part?.text === "string" ? part.text : "")
      .join("")
      .trim();
  }

  return "";
}

function parseJsonSafely(raw: string) {
  try {
    return JSON.parse(raw) as ChatCompletionResponse;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const provider = getProviderConfig();
    if (!provider) {
      return NextResponse.json(
        { error: "Set OPENROUTER_API_KEY, OPENAI_API_KEY, or TOKENROUTER_API_KEY on the server before generating wishes." },
        { status: 500 },
      );
    }

    const body = await request.json() as WishRequest;
    if (!body.name || !body.occasion || !body.tone) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const prompt = [
      "Write one concise personal message for an important date.",
      `Name: ${body.name}`,
      `Occasion: ${body.occasion}`,
      `Tone: ${body.tone}`,
      body.relation ? `Relation: ${body.relation}` : "",
      body.note ? `Saved note: ${body.note}` : "",
      body.details ? `Extra detail: ${body.details}` : "",
      "Rules:",
      "- Return only the final message.",
      "- Keep it natural and human.",
      "- Avoid cliches, hashtags, quotation marks, and explanations.",
      "- Keep it suitable to send as a message.",
    ].filter(Boolean).join("\n");

    const upstreamResponse = await fetch(provider.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(
        provider.provider === "TokenRouter"
          ? {
            model: DEFAULT_MODEL,
            input: prompt,
          }
          : {
            model: DEFAULT_MODEL,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          },
      ),
    });

    const raw = await upstreamResponse.text();
    const data = parseJsonSafely(raw);

    if (!upstreamResponse.ok) {
      const errorMessage = data?.error?.message
        || data?.message
        || `${provider.provider} returned ${upstreamResponse.status}. Check the API key, selected model, and provider settings.`;

      return NextResponse.json({ error: errorMessage }, { status: upstreamResponse.status });
    }

    if (!data) {
      return NextResponse.json(
        { error: `${provider.provider} returned an unexpected response format.` },
        { status: 502 },
      );
    }

    const message = extractMessage(data);
    if (!message) {
      return NextResponse.json({ error: "No message was generated." }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to generate a wish right now." },
      { status: 500 },
    );
  }
}
