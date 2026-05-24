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

// ---------------- LAVALINK (FULL FIX) ----------------
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

      // Lavalink debug logs
      if (kazagumo.shoukaku) {
        kazagumo.shoukaku.on("ready", (name) => {
          console.log(`✅ Lavalink node ready: ${name}`);
        });

        kazagumo.shoukaku.on("error", (name, error) => {
          console.log(`❌ Lavalink node error (${name}):`, error);
        });

        kazagumo.shoukaku.on("close", (name, code, reason) => {
          console.log(
            `⚠️ Lavalink node closed (${name}) Code:${code} Reason:${reason}`
          );
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

// ---------------- VC STAY (24/7 FIX) ----------------

let vcConnection = null;
let reconnecting = false;

async function joinVC() {
  try {
    const guild = client.guilds.cache.get(
      process.env.GUILD_ID
    );

    if (!guild) {
      console.log("❌ Guild not found");
      return;
    }

    const channel = guild.channels.cache.get(
      process.env.CHANNEL_ID
    );

    if (!channel) {
      console.log("❌ Voice channel not found");
      return;
    }

    const existing = getVoiceConnection(guild.id);

    if (existing) {
      vcConnection = existing;
      return;
    }

    vcConnection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    await entersState(
      vcConnection,
      VoiceConnectionStatus.Ready,
      30000
    );

    console.log("🔊 Joined VC permanently");

    vcConnection.on(
      VoiceConnectionStatus.Disconnected,
      async () => {
        if (reconnecting) return;

        reconnecting = true;

        console.log("⚠️ VC disconnected");

        setTimeout(async () => {
          reconnecting = false;

          try {
            vcConnection.destroy();
          } catch {}

          joinVC();
        }, 5000);
      }
    );

    vcConnection.on(
      VoiceConnectionStatus.Destroyed,
      () => {
        console.log("❌ VC destroyed");

        setTimeout(() => {
          joinVC();
        }, 5000);
      }
    );

  } catch (err) {
    console.log("VC error:", err.message);

    setTimeout(() => {
      joinVC();
    }, 5000);
  }
}

// heartbeat
setInterval(() => {
  try {
    const conn = getVoiceConnection(
      process.env.GUILD_ID
    );

    if (!conn) {
      console.log("🔁 VC missing → reconnecting");
      joinVC();
    }
  } catch {}
}, 15000);

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
      {
        name: "beating prodhan",
      },
    ],
    status: "online",
  });

  // join VC after startup
  setTimeout(() => {
    joinVC();
  }, 5000);
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