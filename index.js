require("dotenv").config();

const express = require("express");
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();

// EXPRESS
const app = express();

app.get("/", (req, res) => {
  res.send("Bot alive");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

// LOAD COMMANDS
const folders = fs.readdirSync("./commands");

for (const folder of folders) {
  const files = fs
    .readdirSync(`./commands/${folder}`)
    .filter(f => f.endsWith(".js"));

  for (const file of files) {
    const command = require(`./commands/${folder}/${file}`);

    client.commands.set(command.data.name, command);
  }
}

// LAVALINK
const kazagumo = require("./utils/lavalink")(client);

client.kazagumo = kazagumo;

// VC STAY
const stayInVC = require("./utils/vcStay");

// EVENTS
require("./handlers/interactionHandler")(client);

// READY
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "beating prodhan" }],
    status: "online",
  });
});

// ERROR PREVENTION
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.login(process.env.TOKEN);