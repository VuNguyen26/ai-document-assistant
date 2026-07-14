export interface TextChunk {
  chunkIndex: number;
  content: string;
  charCount: number;
  startOffset: number;
  endOffset: number;
}

export interface ChunkTextOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export function chunkText(
  text: string,
  options: ChunkTextOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? 1200;
  const chunkOverlap = options.chunkOverlap ?? 200;

  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }

  if (chunkOverlap < 0) {
    throw new Error('chunkOverlap must be greater than or equal to 0');
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be smaller than chunkSize');
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalizedText.length) {
    let end = Math.min(start + chunkSize, normalizedText.length);

    if (end < normalizedText.length) {
      const lastWhitespaceIndex = normalizedText.lastIndexOf(' ', end);
      if (lastWhitespaceIndex > start + Math.floor(chunkSize * 0.6)) {
        end = lastWhitespaceIndex;
      }
    }

    const content = normalizedText.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex,
        content,
        charCount: content.length,
        startOffset: start,
        endOffset: end,
      });
      chunkIndex += 1;
    }

    if (end >= normalizedText.length) {
      break;
    }

    start = Math.max(end - chunkOverlap, start + 1);
  }

  return chunks;
}
