import { NextResponse } from "next/server";

const TOKENROUTER_API_URL = "https://api.tokenrouter.io/v1/chat/completions";
const MODEL = process.env.TOKENROUTER_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.TOKENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TOKENROUTER_API_KEY is missing on the server." }, { status: 500 });
    }

    const body = await request.json() as {
      name?: string;
      occasion?: string;
      relation?: string;
      note?: string;
      details?: string;
      tone?: string;
    };

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

    const response = await fetch(TOKENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Wish generation failed.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const message = typeof data?.choices?.[0]?.message?.content === "string"
      ? data.choices[0].message.content.trim()
      : "";

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
