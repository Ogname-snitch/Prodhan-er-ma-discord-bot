require("dotenv").config();

const express = require("express");
const path = require("path");

// ---------------- DISCORD IMPORTS ----------------
const {
  Client,
  GatewayIntentBits,
  Events,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");

const {
  joinVoiceChannel,
} = require("@discordjs/voice");

// ---------------- EXPRESS SERVER ----------------
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

// ---------------- IMAGE ROULETTE ----------------
const prodhanImages = [
  "./images/prodhan1.jpeg",
  "./images/prodhan2.jpeg",
  "./images/prodhan3.jpeg",
  "./images/prodhan4.jpeg",
  "./images/prodhan5.jpeg",
];

// ---------------- DISCORD CLIENT ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

let connection;

// ---------------- READY EVENT ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // ---------------- SLASH COMMANDS ----------------
  const commands = [
    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("Send random roulette image"),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commands registered!");
  } catch (err) {
    console.error("Command register error:", err);
  }

  // ---------------- JOIN VOICE CHANNEL ----------------
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return console.log("Guild not found");

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) return console.log("Voice channel not found");

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  console.log("Joined VC successfully");
});

// ---------------- COMMAND HANDLER ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ---------------- /prodhan ROULETTE ----------------
  if (interaction.commandName === "prodhan") {

    const randomImage =
      prodhanImages[Math.floor(Math.random() * prodhanImages.length)];

    return interaction.reply({
      content: "🎰 Rolling the roulette...",
      files: [randomImage],
    });
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);