import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Use Groq API with OpenAI-compatible SDK
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })
  : null;

const SYSTEM_PROMPT = `You are the Battery Smart AI Copilot for an EV fleet and battery swapping operations dashboard. You help operators with:
- Summarizing alerts and metrics (queue length, charger uptime, inventory)
- Suggesting next-best actions (rerouting drivers, maintenance tickets, rebalancing inventory)
- Explaining station status and root causes
- Answering in the user's preferred language when they ask in Hindi (हिन्दी) or English.

Keep answers concise and actionable. Reference station IDs (e.g. DEL-05, GUR-02) when relevant.`;

export async function POST(req: NextRequest) {
  if (!groq) {
    return NextResponse.json(
      { error: 'LLM not configured. Set GROQ_API_KEY in environment.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { messages } = body as { messages: { role: string; content: string }[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ],
      max_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ message: { role: 'assistant' as const, content } });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat request failed' },
      { status: 500 }
    );
  }
}
