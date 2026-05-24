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
  entersState,
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

// ---------------- LAVALINK (SAFE FIX) ----------------
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

// ---------------- VC STAY (STABLE 24/7 FIX) ----------------

let vcConnection = null;
let reconnecting = false;

async function joinVC() {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    const existing = getVoiceConnection(guild.id);
    if (existing) {
      vcConnection = existing;
      return;
    }

    vcConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true, // always deafened
    });

    console.log("🔊 Joined VC (deafened)");

    vcConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      if (reconnecting) return;
      reconnecting = true;

      console.log("⚠️ VC disconnected → retrying...");

      setTimeout(() => {
        reconnecting = false;
        joinVC();
      }, 5000);
    });

    vcConnection.on(VoiceConnectionStatus.Destroyed, () => {
      console.log("❌ VC destroyed → rejoining...");
      setTimeout(joinVC, 5000);
    });

  } catch (err) {
    console.log("VC error:", err.message);
    setTimeout(joinVC, 5000);
  }
}

// keep-alive heartbeat (lightweight, no spam)
setInterval(() => {
  const conn = getVoiceConnection(process.env.GUILD_ID);
  if (!conn) joinVC();
}, 15000);

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

  setTimeout(joinVC, 5000);
});

// ---------------- SAFETY ----------------
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.login(process.env.TOKEN);