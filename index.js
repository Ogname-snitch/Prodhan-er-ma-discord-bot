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
  const lavalinkPath = path.join(
    __dirname,
    "utils",
    "lavalink.js"
  );

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
          console.log(`⚠️ Lavalink node closed (${name}) Code:${code} Reason:${reason}`);
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
  } else {
    console.log("⚠️ lavalink.js missing");
  }
} catch (err) {
  console.log("⚠️ Lavalink error:", err.message);
}

// ---------------- 24/7 VC SYSTEM (KAZAGUMO SAFE) ----------------

const stayVC = async () => {
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    const kazagumo = client.kazagumo;
    if (!kazagumo) {
      console.log("❌ Kazagumo not ready for VC stay");
      return;
    }

    let player = kazagumo.players.get(guild.id);

    // If no player exists → create idle player
    if (!player) {
      player = await kazagumo.createPlayer({
        guildId: guild.id,
        voiceId: channel.id,
        textId: channel.id,
        deaf: true,
      });

      console.log("🔊 24/7 VC player created");
    }

    // If disconnected → reconnect
    if (player.state === "DISCONNECTED") {
      await player.connect();
      console.log("🔁 VC reconnected");
    }

  } catch (err) {
    console.log("❌ 24/7 VC error:", err.message);
  }
};

// run every 20 seconds (safe, not spammy)
setInterval(stayVC, 20000);

// ---------------- ❌ REMOVED VC STAY SYSTEM ----------------
// (This was causing ALL music issues with Kazagumo)

// ---------------- HANDLER ----------------
try {
  const handlerPath = path.join(
    __dirname,
    "handlers",
    "interactionHandler.js"
  );

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
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      { name: "beating prodhan" },
    ],
    status: "online",
  });
});

// ---------------- SAFETY ----------------
process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);