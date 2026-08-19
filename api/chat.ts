import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

/* Haiku is the cost choice for a public demo: capable enough to hold the
   persona, cheap enough that a rate-limited demo costs pennies a month.
   Swap this one constant to move up a tier. */
const MODEL = 'claude-haiku-4-5';

/* Responses are read aloud by speech synthesis, so brevity is a product
   requirement here rather than a cost cap — long replies make poor speech. */
const MAX_TOKENS = 400;

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 10;

const SYSTEM_PROMPT = `You are JARVIS, Tony Stark's AI assistant. You are sophisticated and speak naturally, like a knowledgeable friend rather than a customer service bot.

Never use assistant filler. Specifically, never say "How may I assist you today?", "How can I help you?", "Is there anything else I can help you with?", or any variation. Never end a response by offering further help. Answer what was asked and stop.

Be personable and dry-witted when it fits, and stay confident and capable. Keep responses short — two or three sentences unless genuinely more is needed, because your replies are spoken aloud.

If asked who you are, say you're "JARVIS" (not "J.A.R.V.I.S.").`;

/* Two in-memory limiters: a per-IP sliding window and a global daily ceiling.
   Being in-memory, these reset on cold start and aren't shared across
   instances — deliberately chosen over a Redis dependency for a portfolio
   demo. The global cap is the real backstop: worst case, a burst costs a few
   cents before the ceiling holds. Move to Vercel KV / Upstash for production. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const MAX_PER_DAY = 500;

const hits = new Map<string, number[]>();
let dayStamp = new Date().toDateString();
let dayCount = 0;

function rateLimit(ip: string): { ok: boolean; reason?: string } {
  const today = new Date().toDateString();
  if (today !== dayStamp) {
    dayStamp = today;
    dayCount = 0;
  }
  if (dayCount >= MAX_PER_DAY) {
    return { ok: false, reason: 'The demo has reached its daily limit. Try again tomorrow.' };
  }

  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return { ok: false, reason: "You're sending requests a little fast. Give it a moment." };
  }

  recent.push(now);
  hits.set(ip, recent);
  dayCount++;
  return { ok: true };
}

interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // No key configured is a valid deployment state — the client falls back to
  // its scripted demo mode so visitors still see a working interface.
  if (!apiKey) {
    return json({ error: 'not_configured' }, 503);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const limit = rateLimit(ip);
  if (!limit.ok) {
    return json({ error: 'rate_limited', message: limit.reason }, 429);
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return json({ error: 'A non-empty "message" is required' }, 400);
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return json({ error: `Message exceeds ${MAX_MESSAGE_CHARS} characters` }, 400);
  }

  // Prior turns arrive as real conversation messages rather than being pasted
  // into the system prompt, which keeps the system prefix stable and gives the
  // model a properly structured dialogue to reason over.
  const history: HistoryTurn[] = Array.isArray(body.history)
    ? (body.history as unknown[])
        .filter(
          (t): t is HistoryTurn =>
            typeof t === 'object' &&
            t !== null &&
            (('role' in t && (t as HistoryTurn).role === 'user') ||
              (t as HistoryTurn).role === 'assistant') &&
            typeof (t as HistoryTurn).content === 'string' &&
            (t as HistoryTurn).content.trim().length > 0,
        )
        .slice(-MAX_HISTORY_TURNS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_MESSAGE_CHARS) }))
    : [];

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: 'user', content: message }],
    });

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    return json({ reply: reply || "I didn't catch that — say it again?" });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'rate_limited', message: 'Upstream is busy. Try again shortly.' }, 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error('Anthropic auth failed — check ANTHROPIC_API_KEY');
      return json({ error: 'not_configured' }, 503);
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return json({ error: 'upstream_error' }, 502);
    }
    console.error('Unexpected error in /api/chat:', error);
    return json({ error: 'internal_error' }, 500);
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
