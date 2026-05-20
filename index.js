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

// ---------------- LAVALINK / MUSIC ----------------
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

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

// ---------------- KAZAGUMO / LAVALINK ----------------
const kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);

      if (guild) {
        guild.shard.send(payload);
      }
    },

    nodes: [
      {
        name: "Localhost",
        url: process.env.LAVALINK_HOST,
        auth: process.env.LAVALINK_PASSWORD,
        secure: false,
      },
    ],
  },

  new Connectors.DiscordJS(client)
);

// ---------------- LAVALINK EVENTS ----------------
kazagumo.shoukaku.on("ready", (name) => {
  console.log(`Lavalink ${name} connected`);
});

kazagumo.shoukaku.on("error", (name, error) => {
  console.log(`Lavalink ${name} error:`, error);
});

// ---------------- READY EVENT ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // ---------------- SLASH COMMANDS ----------------
  const commands = [

    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("Send random roulette image"),

    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play music with Lavalink")
      .addStringOption(option =>
        option
          .setName("song")
          .setDescription("Song name or URL")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("skip")
      .setDescription("Skip current song"),

    new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stop music"),

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

  if (!guild) {
    return console.log("Guild not found");
  }

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

  if (!channel) {
    return console.log("Voice channel not found");
  }

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

  // =====================================================
  // /PRODHAN
  // =====================================================

  if (interaction.commandName === "prodhan") {

    try {

      const imageFolder = path.join(__dirname, "images");

      const images = fs.readdirSync(imageFolder).filter(file =>
        file.endsWith(".png") ||
        file.endsWith(".jpg") ||
        file.endsWith(".jpeg") ||
        file.endsWith(".webp")
      );

      if (!images.length) {
        return interaction.reply("❌ No images found in /images folder.");
      }

      const randomImage =
        images[Math.floor(Math.random() * images.length)];

      const filePath = path.join(imageFolder, randomImage);

      console.log("Selected image:", filePath);

      return await interaction.reply({
        content: "🎰 Rolling the roulette...",
        files: [filePath],
      });

    } catch (err) {

      console.error("PRODHAN ERROR:", err);

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp("❌ Error sending image.");
      }

      return interaction.reply("❌ Error sending image.");
    }
  }

  // =====================================================
  // /PLAY
  // =====================================================

  if (interaction.commandName === "play") {

    try {

      const query = interaction.options.getString("song");
      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply(
          "❌ Join a voice channel first."
        );
      }

      await interaction.reply(`🔍 Searching: **${query}**`);

      let player = kazagumo.players.get(interaction.guild.id);

      if (!player) {

        player = await kazagumo.createPlayer({
          guildId: interaction.guild.id,
          textId: interaction.channel.id,
          voiceId: voiceChannel.id,
          deaf: true,
        });
      }

      const result = await kazagumo.search(
        query,
        {
          requester: interaction.user,
        }
      );

      if (!result.tracks.length) {
        return interaction.followUp("❌ No songs found.");
      }

      const track = result.tracks[0];

      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      }

      return interaction.followUp(
        `🎵 Now playing: **${track.title}**`
      );

    } catch (err) {

      console.error("PLAY ERROR:", err);

      return interaction.followUp(
        "❌ Failed to play song."
      );
    }
  }

  // =====================================================
  // /SKIP
  // =====================================================

  if (interaction.commandName === "skip") {

    const player = kazagumo.players.get(interaction.guild.id);

    if (!player) {
      return interaction.reply("❌ No music is playing.");
    }

    player.skip();

    return interaction.reply("⏭️ Skipped song.");
  }

  // =====================================================
  // /STOP
  // =====================================================

  if (interaction.commandName === "stop") {

    const player = kazagumo.players.get(interaction.guild.id);

    if (!player) {
      return interaction.reply("❌ No music is playing.");
    }

    player.destroy();

    return interaction.reply("🛑 Music stopped.");
  }

});

// ---------------- LOGIN -----------------
client.login(process.env.TOKEN);