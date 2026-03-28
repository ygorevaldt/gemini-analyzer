import { Chunk } from "./types";

export class Chunker {
  chunkDocument(pages: string[]): Chunk[] {
    const chunks: Chunk[] = [];
    const CHUNK_SIZE = 20; // Max pages per chunk

    for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
      const chunkPages = pages.slice(i, i + CHUNK_SIZE);
      const startPage = i + 1;
      const endPage = Math.min(i + CHUNK_SIZE, pages.length);
      
      const content = chunkPages
        .map((text, index) => `\n--- PÁGINA ${startPage + index} ---\n${text}`)
        .join('\n');

      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        startPage,
        endPage,
        content
      });
    }

    return chunks;
  }
}
