function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripBotMention(content: string, botId: string): string {
  const escaped = escapeRegExp(botId);
  return content
    .replace(new RegExp(`<@!?${escaped}>`, "g"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitDiscordMessage(text: string, maxLength = 1900): string[] {
  if (text.length <= maxLength) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxLength) {
    const slice = remaining.slice(0, maxLength);
    const boundary = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf("\n"), slice.lastIndexOf(". "));
    const cut = boundary > Math.floor(maxLength * 0.55) ? boundary + 1 : maxLength;
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}
