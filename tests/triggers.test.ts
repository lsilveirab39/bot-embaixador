import assert from "node:assert/strict";
import test from "node:test";
import { shouldRespond } from "../src/discord/triggers.js";

const base = {
  isBotAuthor: false,
  isDirectMessage: false,
  directMessagesEnabled: false,
  mentionedBot: false,
  repliedToBot: false,
  replyTriggerEnabled: true,
  guildAllowed: true,
  channelAllowed: true,
};

test("responde quando o bot é mencionado", () => {
  assert.equal(shouldRespond({ ...base, mentionedBot: true }), true);
});

test("responde quando é uma resposta ao bot", () => {
  assert.equal(shouldRespond({ ...base, repliedToBot: true }), true);
});

test("ignora conversa geral sem direcionamento", () => {
  assert.equal(shouldRespond(base), false);
});

test("ignora mensagens de bots e canais não permitidos", () => {
  assert.equal(shouldRespond({ ...base, mentionedBot: true, isBotAuthor: true }), false);
  assert.equal(shouldRespond({ ...base, mentionedBot: true, channelAllowed: false }), false);
});
