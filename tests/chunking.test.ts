import assert from "node:assert/strict";
import test from "node:test";
import { chunkText } from "../src/rag/chunking.js";

test("divide texto preservando conteúdo", () => {
  const text = "A".repeat(700) + "\n\n" + "B".repeat(700);
  const chunks = chunkText(text, 800, 100);
  assert.ok(chunks.length >= 2);
  assert.ok(chunks.every((chunk) => chunk.content.length <= 800));
});

test("rejeita overlap maior ou igual ao tamanho", () => {
  assert.throws(() => chunkText("texto", 100, 100));
});
