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

// ---------------- COMMAND LOADER ----------------
const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.existsSync(folderPath)) continue;

    const files = fs
      .readdirSync(folderPath)
      .filter(f => f.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(folderPath, file);

      try {
        delete require.cache[require.resolve(filePath)];

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
} else {
  console.log("❌ Commands folder missing");
}

// ---------------- LAVALINK (UNCHANGED) ----------------
let kazagumo = null;

try {
  const lavalinkPath = path.join(__dirname, "utils", "lavalink.js");

  if (fs.existsSync(lavalinkPath)) {
    kazagumo = require(lavalinkPath)(client);

    if (kazagumo) {
      client.kazagumo = kazagumo;

      console.log("✅ Lavalink loaded");

      if (kazagumo.shoukaku) {
        kazagumo.shoukaku.on("ready", (name) => {
          console.log(`✅ Lavalink node ready: ${name}`);
        });

        kazagumo.shoukaku.on("error", (name, error) => {
          console.log(`❌ Lavalink node error (${name}):`, error);
        });

        kazagumo.shoukaku.on("close", (name, code, reason) => {
          console.log(`⚠️ Lavalink node closed (${name}) Code:${code}`);
        });

        kazagumo.shoukaku.on("disconnect", (name) => {
          console.log(`⚠️ Lavalink node disconnected: ${name}`);
        });

        kazagumo.shoukaku.on("reconnecting", (name) => {
          console.log(`🔁 Lavalink reconnecting: ${name}`);
        });
      }
    }
  }
} catch (err) {
  console.log("⚠️ Lavalink error:", err.message);
}

// ---------------- SAFE 24/7 VC SYSTEM (FIXED) ----------------
//
// IMPORTANT FIX:
// ❌ removed broken joinVC()
// ❌ removed getVoiceConnection spam loop
// ❌ removed conflicting VC systems
//
// ✔ Kazagumo handles ALL VC connections

async function keepPlayerAlive() {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    if (!client.kazagumo) return;

    let player = client.kazagumo.players.get(guild.id);

    // create idle player if missing
    if (!player) {
      player = await client.kazagumo.createPlayer({
        guildId: guild.id,
        voiceId: channel.id,
        textId: channel.id,
        deaf: true,
      });

      console.log("🔊 24/7 VC player created");
    }

    // reconnect safely if needed
    if (player.state === "DISCONNECTED") {
      await player.connect();
      console.log("🔁 VC reconnected safely");
    }

  } catch (err) {
    console.log("❌ VC keep-alive error:", err.message);
  }
}

// ONLY ONE interval (prevents crashes + lag)
setInterval(keepPlayerAlive, 30000);

// ---------------- HANDLER ----------------
try {
  const handlerPath = path.join(__dirname, "handlers", "interactionHandler.js");

  if (fs.existsSync(handlerPath)) {
    require(handlerPath)(client);
    console.log("✅ handler loaded");
  }
} catch (err) {
  console.log("⚠️ handler error:", err.message);
}

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "beating prodhan" }],
    status: "online",
  });

  // start VC system only AFTER login
  setTimeout(() => {
    keepPlayerAlive();
  }, 5000);
});

// ---------------- SAFETY ----------------
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);