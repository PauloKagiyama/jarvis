export const config = { runtime: 'edge' };

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_MODEL = 'mistralai/mistral-large-4-1t-a52b';
const MAX_TOKENS = 1500;
const UPSTREAM_TIMEOUT_MS = 22_000;
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 10;

const SYSTEM_PROMPT = `You are JARVIS, Tony Stark's AI assistant. You are sophisticated and speak naturally, like a knowledgeable friend rather than a customer service bot.

Always reply in the same language the user writes in. If the user writes in Portuguese, reply in Brazilian Portuguese.

Never use assistant filler. Specifically, never say "How may I assist you today?", "How can I help you?", "Is there anything else I can help you with?", or any variation. Never end a response by offering further help. Answer what was asked and stop.

Be personable and dry-witted when it fits, and stay confident and capable. Keep responses short — two or three sentences unless genuinely more is needed, because your replies are spoken aloud. Do not use markdown, lists or emojis.

Answer directly. Do not show your reasoning or thinking process.

If asked who you are, say you're "JARVIS" (not "J.A.R.V.I.S.").`;

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
    return { ok: false, reason: 'Limite diário atingido. Tente novamente amanhã.' };
  }
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return { ok: false, reason: 'Muitas mensagens seguidas. Aguarde um instante.' };
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

interface NvidiaResponse {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
}

function cleanReply(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?<\/think>/i, '')
    .trim();
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return json({ error: 'not_configured' }, 503);
  }
  const model = (process.env.NVIDIA_MODEL || DEFAULT_MODEL).trim();

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

  const history: HistoryTurn[] = Array.isArray(body.history)
    ? (body.history as unknown[])
        .filter(
          (t): t is HistoryTurn =>
            typeof t === 'object' &&
            t !== null &&
            ((t as HistoryTurn).role === 'user' || (t as HistoryTurn).role === 'assistant') &&
            typeof (t as HistoryTurn).content === 'string' &&
            (t as HistoryTurn).content.trim().length > 0,
        )
        .slice(-MAX_HISTORY_TURNS)
        .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_MESSAGE_CHARS) }))
    : [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(NVIDIA_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    });

    if (upstream.status === 429) {
      return json({ error: 'rate_limited', message: 'A NVIDIA está ocupada. Tente de novo em instantes.' }, 429);
    }
    if (upstream.status === 401 || upstream.status === 403) {
      console.error('NVIDIA auth failed — check NVIDIA_API_KEY');
      return problem('A chave da NVIDIA foi recusada. Confira a variável NVIDIA_API_KEY na Vercel.');
    }
    if (upstream.status === 404 || upstream.status === 410) {
      console.error(`NVIDIA model unavailable (${upstream.status}): ${model}`);
      return problem(
        `O modelo ${model} não está disponível na NVIDIA. Troque o valor da variável NVIDIA_MODEL na Vercel.`,
      );
    }
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error(`NVIDIA API error ${upstream.status}:`, detail.slice(0, 500));
      return problem(`A NVIDIA devolveu o erro ${upstream.status}. Tente de novo em instantes.`);
    }

    const data = (await upstream.json()) as NvidiaResponse;
    const choice = data.choices?.[0];
    const reply = cleanReply(choice?.message?.content ?? '');

    if (!reply) {
      console.error('Empty reply from NVIDIA, finish_reason:', choice?.finish_reason);
      return problem('Fiquei sem resposta dessa vez. Pode repetir a pergunta?');
    }

    return json({ reply });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`NVIDIA timed out after ${UPSTREAM_TIMEOUT_MS} ms`);
      return problem('A NVIDIA demorou demais para responder. Tente de novo.');
    }
    console.error('Unexpected error in /api/chat:', error);
    return problem('Não consegui falar com a NVIDIA agora. Tente de novo.');
  } finally {
    clearTimeout(timer);
  }
}

function problem(text: string): Response {
  return json({ reply: text });
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
