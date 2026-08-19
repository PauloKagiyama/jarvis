/* Scripted fallback used when the backend has no API key configured or the
   demo's rate limit is spent. The interface stays fully explorable instead of
   showing an error, which matters for a deployed portfolio demo. Responses are
   written in the same voice as the system prompt so the illusion holds. */

interface DemoRule {
  match: RegExp;
  replies: string[];
}

const RULES: DemoRule[] = [
  {
    match: /\b(hello|hi|hey|good (morning|afternoon|evening))\b/i,
    replies: [
      'Good to see you. Systems are green across the board.',
      'Online and listening. What are we working on?',
    ],
  },
  {
    match: /\b(who are you|your name|what are you)\b/i,
    replies: [
      "I'm JARVIS. I handle the systems around here so you don't have to think about them.",
    ],
  },
  {
    match: /\b(status|diagnostic|system|report)\b/i,
    replies: [
      'All systems nominal. Reactor output steady at 1.21 gigawatts, thermal load well inside tolerance.',
      'Everything is running clean. No faults logged since the last cycle.',
    ],
  },
  {
    match: /\b(weather|temperature|forecast)\b/i,
    replies: [
      "Clear skies, seventy-two degrees, wind light out of the west. Good flying conditions, if you're asking.",
    ],
  },
  {
    match: /\b(time|date|what day)\b/i,
    replies: ['Local time is on the display to your lower right. You are, as usual, running late.'],
  },
  {
    match: /\b(reactor|arc|power|energy)\b/i,
    replies: [
      'The reactor is holding steady. Drag it around if you want a closer look at the housing.',
    ],
  },
  {
    match: /\b(thank|thanks|cheers)\b/i,
    replies: ['Any time.', 'Naturally.'],
  },
];

const FALLBACKS = [
  "I'm running in demo mode right now, so my responses are scripted rather than generated. Connect an API key and I'll answer that properly.",
  "That one needs the live model behind me — I'm on scripted responses at the moment.",
  "Demo mode, I'm afraid. Wire up an API key and ask me again.",
];

let fallbackIndex = 0;

export function getDemoResponse(message: string): string {
  for (const rule of RULES) {
    if (rule.match.test(message)) {
      return rule.replies[Math.floor(Math.random() * rule.replies.length)];
    }
  }
  // Cycle rather than randomise so a visitor sending several unmatched
  // messages doesn't see the same line twice in a row.
  const reply = FALLBACKS[fallbackIndex % FALLBACKS.length];
  fallbackIndex++;
  return reply;
}
