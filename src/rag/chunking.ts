export interface TextChunk {
  index: number;
  content: string;
}

export function chunkText(text: string, size: number, overlap: number): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  if (overlap >= size) throw new Error("overlap deve ser menor que size");

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + size, normalized.length);
    if (end < normalized.length) {
      const candidates = [
        normalized.lastIndexOf("\n\n", end),
        normalized.lastIndexOf("\n", end),
        normalized.lastIndexOf(". ", end),
        normalized.lastIndexOf(" ", end),
      ];
      const boundary = Math.max(...candidates);
      if (boundary > start + Math.floor(size * 0.6)) {
        end = boundary + 1;
      }
    }

    const content = normalized.slice(start, end).trim();
    if (content) chunks.push({ index: chunks.length, content });
    if (end >= normalized.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
