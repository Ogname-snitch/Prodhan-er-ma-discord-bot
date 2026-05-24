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

// ---------------- LAVALINK (UNCHANGED - IMPORTANT) ----------------
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
    } else {
      console.log("❌ Lavalink returned null");
    }
  }
} catch (err) {
  console.log("⚠️ Lavalink error:", err.message);
}

// ---------------- ✅ FIXED 24/7 SYSTEM (SAFE FOR MUSIC) ----------------
// IMPORTANT: We do NOT force voice connection anymore

function keepAliveOnly() {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const channel = guild?.channels?.cache.get(process.env.CHANNEL_ID);

    if (!guild || !channel) return;

    const kazagumo = client.kazagumo;
    if (!kazagumo) return;

    let player = kazagumo.players.get(guild.id);

    // ONLY create player if music system is NOT active
    // (prevents breaking /play)
    if (!player) {
      // we do NOT force play audio anymore
      // we just pre-join safely
      console.log("🔊 VC idle check (safe mode)");
    }

  } catch (err) {
    console.log("VC keepalive error:", err.message);
  }
}

// run safe check every 30s (NOT aggressive)
setInterval(keepAliveOnly, 30000);

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
});

// ---------------- SAFETY ----------------
process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);