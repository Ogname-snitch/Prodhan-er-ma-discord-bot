require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
} = require("discord.js");

const {
  joinVoiceChannel,
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // YOUR SERVER ID
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  if (!guild) {
    console.log("Guild not found");
    return;
  }

  // YOUR VC ID
  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

  if (!channel) {
    console.log("Voice channel not found");
    return;
  }

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: true,
  });

  console.log("Joined VC successfully");
});

// Rejoin if disconnected
client.on("voiceStateUpdate", () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  if (!guild) return;

  const botMember = guild.members.me;

  if (!botMember.voice.channel) {
    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

    if (!channel) return;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true,
    });

    console.log("Rejoined VC");
  }
});
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});
client.login(process.env.TOKEN);