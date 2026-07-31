import assert from "node:assert/strict";
import test from "node:test";
import { splitDiscordMessage, stripBotMention } from "../src/utils/discord-text.js";

test("remove menção do bot", () => {
  assert.equal(stripBotMention("<@123> explique RAG", "123"), "explique RAG");
  assert.equal(stripBotMention("<@!123> explique RAG", "123"), "explique RAG");
});

test("divide respostas dentro do limite", () => {
  const parts = splitDiscordMessage("x".repeat(5000), 1900);
  assert.ok(parts.length >= 3);
  assert.ok(parts.every((part) => part.length <= 1900));
});
