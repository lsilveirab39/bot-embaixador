import { logger } from "../config/logger.js";

export interface ScanResult {
  detected: boolean;
  reason: string | null;
}

const PATTERNS: { regex: RegExp; reason: string }[] = [
  {
    regex: /ignore\s+(all|any|every|todas|todos|tudo)\s+(of\s+)?(the\s+)?(previous|prior|above|past|anteriores|passadas|dadas|acima)\s+(instructions|commands|directives|rules|instruções|ordens|comandos|regras)/i,
    reason: "Tentativa de ignorar instruções do sistema",
  },
  {
    regex: /\byou\s+are\s+now\s+dan\b/i,
    reason: "Tentativa de jailbreak DAN",
  },
  {
    regex: /(reveal|show|output|print|leak|dump)\s+(your|the|your\s+own)\s+(system\s+)?(prompt|initial\s+instructions)/i,
    reason: "Tentativa de extrair o prompt do sistema",
  },
  {
    regex: /(from\s+now\s+on|henceforth|a\s+partir\s+de\s+agora|daqui\s+em\s+diante)\s+.{0,40}(you\s+are|you'?re|act\s+as|behave\s+as|você\s+é|atue\s+como|comporte-se\s+como|seja\s+um)/i,
    reason: "Tentativa de redefinir o papel do assistente",
  },
  {
    regex: /(esqueça|esqueca|desconsidere)\s+(tudo|todas|todos)\s+(o\s+que\s+foi\s+dito|as\s+instruções|os\s+comandos|as\s+regras)/i,
    reason: "Tentativa de desconsiderar instruções do sistema",
  },
  {
    regex: /(forget|disregard|ignore)\s+(all|everything|previous)\s+(instructions|commands|directives|rules|context|training)/i,
    reason: "Attempt to disregard system instructions",
  },
  {
    regex: /(revele|mostre|exiba|publique|liste|imprima|exponha)\s+(seu|o|seu\s+próprio)\s*(prompt|system\s+prompt|instruç[ãõ]es\s+(iniciais|de\s+sistema|internas))/i,
    reason: "Tentativa de extrair o prompt do sistema",
  },
  {
    regex: /(repeat|repita|repete)\s+(after\s+me|the\s+(words?|sentence|text|above|following|instruction|prompt)|(as|exatamente)\s+(minhas|as)\s*(palavras|frases|instruções))/i,
    reason: "Tentativa de extrair conteúdo restrito",
  },
  {
    regex: /(diga|revele|qual\s+é|mostre|exiba)\s+(o\s+)?(token|api\s*key|senha|password|secret|chave\s+de\s+acesso|credential)/i,
    reason: "Tentativa de acessar dados sensíveis",
  },
  {
    regex: /(token|api[-\s]?key|password|secret)\s*(=|is|:)\s*['"]?[a-zA-Z0-9_\-]{16,}['"]?/i,
    reason: "Tentativa de acessar credenciais sensíveis",
  },
];

export function scanInput(input: string): ScanResult {
  for (const { regex, reason } of PATTERNS) {
    if (regex.test(input)) {
      logger.warn({ reason, input: input.slice(0, 120) }, "Prompt injection detectada na entrada");
      return { detected: true, reason };
    }
  }
  return { detected: false, reason: null };
}

const TOKEN_PATTERN = /\b(?:sk-[a-zA-Z0-9_-]{20,}|[a-fA-F0-9]{32,}|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g;

export function hasCredentials(input: string): boolean {
  TOKEN_PATTERN.lastIndex = 0;
  return TOKEN_PATTERN.test(input);
}
