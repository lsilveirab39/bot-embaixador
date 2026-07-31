export interface TriggerInput {
  isBotAuthor: boolean;
  isDirectMessage: boolean;
  directMessagesEnabled: boolean;
  mentionedBot: boolean;
  repliedToBot: boolean;
  replyTriggerEnabled: boolean;
  guildAllowed: boolean;
  channelAllowed: boolean;
}

export function shouldRespond(input: TriggerInput): boolean {
  if (input.isBotAuthor) return false;
  if (!input.guildAllowed || !input.channelAllowed) return false;
  if (input.isDirectMessage) return input.directMessagesEnabled;
  if (input.mentionedBot) return true;
  return input.replyTriggerEnabled && input.repliedToBot;
}
