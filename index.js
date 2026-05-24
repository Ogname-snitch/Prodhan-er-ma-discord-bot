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

const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

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

// ---------------- COMMAND LOADER ----------------
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
          console.log(`❌ Invalid command: ${file}`);
          continue;
        }

        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded: ${file}`);
      } catch (err) {
        console.log(`❌ Failed loading ${file}:`, err.message);
      }
    }
  }
}

// ---------------- VC 24/7 FIX (MAIN PART) ----------------

function keepVCAlive() {
  const guildId = process.env.GUILD_ID;
  const channelId = process.env.CHANNEL_ID;

  if (!guildId || !channelId) {
    console.log("❌ Missing GUILD_ID or CHANNEL_ID");
    return;
  }

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  const existing = getVoiceConnection(guildId);

  if (existing) return; // already connected

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  console.log("🔊 Joined VC");

  // 🔥 auto reconnect if dropped
  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log("⚠️ VC disconnected → reconnecting...");
    setTimeout(keepVCAlive, 3000);
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log("❌ VC destroyed → reconnecting...");
    setTimeout(keepVCAlive, 3000);
  });
}

// heartbeat system (prevents idle kick)
setInterval(() => {
  const connection = getVoiceConnection(process.env.GUILD_ID);

  if (!connection) {
    console.log("🔁 VC missing → reconnecting");
    keepVCAlive();
  }
}, 10000);

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

// ---------------- VC STAY MODULE SKIP ----------------
console.log("ℹ️ Using built-in VC system (vcStay disabled)");

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

  // start VC after login
  setTimeout(keepVCAlive, 5000);
});

// ---------------- SAFETY ----------------
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.login(process.env.TOKEN);