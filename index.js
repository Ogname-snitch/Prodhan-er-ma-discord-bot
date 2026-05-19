require("dotenv").config();

const express = require("express");
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

// ---------------- EXPRESS (KEEP ALIVE) ----------------
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

// ---------------- DISCORD CLIENT ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ---------------- READY EVENT ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return console.log("Guild not found");

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) return console.log("Voice channel not found");

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });

  console.log("Joined VC successfully");
});

// ---------------- AUTO REJOIN ----------------
client.on(Events.VoiceStateUpdate, () => {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const botMember = guild.members.me;

  if (!botMember?.voice?.channel) {
    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });

    console.log("Rejoined VC");
  }
});

// ---------------- SLASH COMMAND ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "prodhan") {
    await interaction.reply({
      content: "Here you go 👇",
      files: [
        "./images/prodhan.jpeg"
      ],
    });
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);