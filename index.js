require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

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

  // ---------------- /prodhan (SAFE ROULETTE) ----------------
  if (interaction.commandName === "prodhan") {
    try {
      const imageFolder = path.join(__dirname, "images");

      // read all images dynamically (FIXES YOUR ISSUE)
      const images = fs.readdirSync(imageFolder).filter(file =>
        file.endsWith(".png") ||
        file.endsWith(".jpg") ||
        file.endsWith(".jpeg") ||
        file.endsWith(".webp")
      );

      if (!images.length) {
        return interaction.reply("❌ No images found in /images folder.");
      }

      const randomImage = images[Math.floor(Math.random() * images.length)];
      const filePath = path.join(imageFolder, randomImage);

      console.log("Selected image:", filePath);

      return await interaction.reply({
        content: "🎰 Rolling the roulette...",
        files: [filePath],
      });

    } catch (err) {
      console.error("PRODHAN ERROR:", err);

      // ALWAYS respond to avoid "Application didn't respond"
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp("❌ Error sending image.");
      }

      return interaction.reply("❌ Error sending image.");
    }
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);