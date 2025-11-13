/**
 * Greeting detection utility for RAG tool
 * Detects common greeting patterns and provides appropriate responses
 */

const GREETING_PATTERNS = [
  /^hi\s*$/i,
  /^hello\s*$/i,
  /^hey\s*$/i,
  /^greetings\s*$/i,
  /^oh\s+hello\s*$/i,
  /^oh\s+hi\s*$/i,
  /^hi\s+there\s*$/i,
  /^hello\s+there\s*$/i,
  /^good\s+(morning|afternoon|evening)\s*$/i,
  /^gm\s*$/i,
  /^good\s+day\s*$/i,
];

const GREETING_RESPONSES = [
  "Hello! I'm CropSense, your AI agricultural assistant. How can I help you today?",
  "Hi there! Ask me anything about farming, crops, soil health, or pest management.",
  "Hello! I'm here to help with your agricultural questions. What would you like to know?",
  "Hi! I'm CropSense. I can help you with crop management, pest control, soil health, and more. What's your question?",
];

/**
 * Check if a message is a greeting
 */
export function isGreeting(message: string): boolean {
  const trimmed = message.trim();
  return GREETING_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Get a random greeting response
 */
export function getGreetingResponse(): string {
  return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
}

/**
 * Normalize greeting for consistent detection
 */
export function normalizeGreeting(message: string): string {
  return message.trim().toLowerCase();
}

