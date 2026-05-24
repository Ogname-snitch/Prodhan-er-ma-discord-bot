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
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
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

// ---------------- VC KEEP ALIVE FIX (REAL FIX) ----------------

let connection = null;
let player = null;

function createSilentAudio() {
  // 1-second silent audio buffer (prevents AFK disconnect)
  const buffer = Buffer.from([0xF8, 0xFF, 0xFE]);
  return createAudioResource(buffer, { inlineVolume: false });
}

async function joinVC() {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  const channel = guild?.channels?.cache.get(process.env.CHANNEL_ID);

  if (!guild || !channel) return;

  if (getVoiceConnection(guild.id)) return;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true, // 🔥 ALWAYS DEAFENED
  });

  console.log("🔊 Joined VC (deafened)");

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch (err) {
    console.log("❌ VC failed, retrying...");
    setTimeout(joinVC, 5000);
    return;
  }

  // create audio player (keeps VC alive)
  player = createAudioPlayer();

  player.on(AudioPlayerStatus.Idle, () => {
    const resource = createSilentAudio();
    player.play(resource);
  });

  connection.subscribe(player);

  // start silent loop
  player.play(createSilentAudio());
}

// auto-reconnect system
setInterval(() => {
  const conn = getVoiceConnection(process.env.GUILD_ID);

  if (!conn) {
    console.log("🔁 VC missing → reconnecting");
    joinVC();
  }
}, 10000);

// handle VC state crashes
function setupVCEvents() {
  if (!connection) return;

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log("⚠️ VC disconnected → reconnecting");
    setTimeout(joinVC, 3000);
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    console.log("❌ VC destroyed → reconnecting");
    setTimeout(joinVC, 3000);
  });
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

  setTimeout(() => {
    joinVC();
    setupVCEvents();
  }, 5000);
});

// ---------------- SAFETY ----------------
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.login(process.env.TOKEN);