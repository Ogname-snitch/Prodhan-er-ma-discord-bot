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

// ---------------- EXPRESS ----------------
const app = express();

app.get("/", (req, res) => {
  res.send("Bot alive");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

// ---------------- LOAD COMMANDS ----------------
if (fs.existsSync("./commands")) {
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
}

// ---------------- LAVALINK ----------------
let kazagumo = null;

try {
  kazagumo = require("./utils/lavalink")(client);
  client.kazagumo = kazagumo;
} catch (err) {
  console.log("⚠️ Lavalink not loaded:", err.message);
}

// ---------------- VC STAY (SAFE FIX) ----------------
try {
  if (fs.existsSync("./utils/vcStay.js")) {
    require("./utils/vcStay")(client);
  } else {
    console.log("⚠️ vcStay.js missing — skipping VC auto join");
  }
} catch (err) {
  console.log("⚠️ vcStay error:", err.message);
}

// ---------------- HANDLERS ----------------
try {
  require("./handlers/interactionHandler")(client);
} catch (err) {
  console.log("⚠️ interactionHandler missing:", err.message);
}

// ---------------- READY ----------------
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "beating prodhan" }],
    status: "online",
  });
});

// ---------------- ERROR SAFETY ----------------
process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});

client.login(process.env.TOKEN);