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

// ---------------- COMMAND LOADER (FIXED) ----------------
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.existsSync(folderPath)) continue;

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      try {
        const command = require(filePath);

        if (!command?.data?.name) {
          console.log(`❌ Invalid command structure: ${file}`);
          continue;
        }

        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded: ${file}`);
      } catch (err) {
        console.log(`❌ Failed loading ${file}:`, err.message);
      }
    }
  }
} else {
  console.log("❌ commands folder not found");
}

// ---------------- LAVALINK ----------------
let kazagumo = null;

try {
  const lavalinkPath = path.join(__dirname, "utils", "lavalink.js");

  if (fs.existsSync(lavalinkPath)) {
    kazagumo = require(lavalinkPath)(client);
    client.kazagumo = kazagumo;
    console.log("✅ Lavalink loaded");
  } else {
    console.log("⚠️ Lavalink missing");
  }
} catch (err) {
  console.log("⚠️ Lavalink error:", err.message);
}

// ---------------- VC STAY ----------------
try {
  const vcPath = path.join(__dirname, "utils", "vcStay.js");

  if (fs.existsSync(vcPath)) {
    require(vcPath)(client);
    console.log("✅ vcStay loaded");
  } else {
    console.log("⚠️ vcStay missing");
  }
} catch (err) {
  console.log("⚠️ vcStay error:", err.message);
}

// ---------------- HANDLER ----------------
try {
  const handlerPath = path.join(__dirname, "handlers", "interactionHandler.js");

  if (fs.existsSync(handlerPath)) {
    require(handlerPath)(client);
    console.log("✅ handler loaded");
  } else {
    console.log("⚠️ handler missing");
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

// ---------------- SAFETY ----------------
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.login(process.env.TOKEN);