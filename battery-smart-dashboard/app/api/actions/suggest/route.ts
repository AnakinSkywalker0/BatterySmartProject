import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Use Groq API with OpenAI-compatible SDK
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })
  : null;

export async function POST(req: NextRequest) {
  if (!groq) {
    return NextResponse.json(
      { error: 'LLM not configured. Set GROQ_API_KEY in environment.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      metrics = [],
      alerts = [],
      language = 'en',
    } = body as {
      metrics?: { label: string; value: string; status: string }[];
      alerts?: { station: string; message: string; type: string }[];
      language?: string;
    };

    const prompt = `Based on this fleet dashboard context, suggest 1–3 concrete next-best actions. Return a JSON array of objects with "title", "subtitle", "priority" (1-3). No other text.

Metrics: ${JSON.stringify(metrics)}
Recent alerts: ${JSON.stringify(alerts)}

Respond only with the JSON array, e.g. [{"title":"Reroute to DEL-03","subtitle":"Low load (25%)","priority":1}].`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are the Battery Smart AI Copilot. Output only valid JSON array of action suggestions.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 256,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
    const parsed = (() => {
      const stripped = raw.replace(/^```json?\s*|\s*```$/g, '');
      try {
        return JSON.parse(stripped);
      } catch {
        return [];
      }
    })();

    return NextResponse.json({
      suggestions: Array.isArray(parsed) ? parsed : [],
      language,
    });
  } catch (err) {
    console.error('Suggest API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Suggest request failed' },
      { status: 500 }
    );
  }
}
