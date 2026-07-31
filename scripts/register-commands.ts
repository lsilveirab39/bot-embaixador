import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commandDefinitions } from "../src/discord/commands.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token || !clientId) throw new Error("DISCORD_TOKEN e DISCORD_CLIENT_ID são obrigatórios");

const rest = new REST({ version: "10" }).setToken(token);
if (guildId) {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandDefinitions });
  console.log(`Comandos registrados no servidor ${guildId}.`);
} else {
  await rest.put(Routes.applicationCommands(clientId), { body: commandDefinitions });
  console.log("Comandos globais registrados.");
}
