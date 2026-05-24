require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");

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
try {
  if (fs.existsSync("./commands")) {
    const folders = fs.readdirSync("./commands");

    for (const folder of folders) {
      const folderPath = `./commands/${folder}`;

      if (!fs.existsSync(folderPath)) continue;

      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".js"));

      for (const file of files) {
        const filePath = path.join(folderPath, file);

        try {
          const command = require(filePath);

          if (command?.data?.name) {
            client.commands.set(command.data.name, command);
          }
        } catch (err) {
          console.log(`❌ Failed loading command ${file}:`, err.message);
        }
      }
    }
  }
} catch (err) {
  console.log("❌ Command loader error:", err.message);
}

// ---------------- LAVALINK ----------------
let kazagumo = null;

try {
  const lavalinkPath = "./utils/lavalink.js";

  if (fs.existsSync(lavalinkPath)) {
    kazagumo = require(lavalinkPath)(client);
    client.kazagumo = kazagumo;
    console.log("✅ Lavalink loaded");
  } else {
    console.log("⚠️ lavalink.js not found, skipping music system");
  }
} catch (err) {
  console.log("⚠️ Lavalink error:", err.message);
}

// ---------------- VC STAY (SAFE FIX) ----------------
try {
  const vcPath = "./utils/vcStay.js";

  if (fs.existsSync(vcPath)) {
    require(vcPath)(client);
    console.log("✅ vcStay loaded");
  } else {
    console.log("⚠️ vcStay.js missing — skipping auto VC join");
  }
} catch (err) {
  console.log("⚠️ vcStay error:", err.message);
}

// ---------------- HANDLERS ----------------
try {
  const handlerPath = "./handlers/interactionHandler.js";

  if (fs.existsSync(handlerPath)) {
    require(handlerPath)(client);
    console.log("✅ interaction handler loaded");
  } else {
    console.log("⚠️ interactionHandler missing");
  }
} catch (err) {
  console.log("⚠️ handler error:", err.message);
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