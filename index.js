require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  Events,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");

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

// ---------------- LAVALINK NODES ----------------
const nodes = [
  {
    name: "Lavalink-1",
    url: process.env.LAVALINK_HOST,
    auth: process.env.LAVALINK_PASSWORD,
    secure: false,
  },
];

// ---------------- KAZAGUMO SETUP ----------------
const kazagumo = new Kazagumo(
  {
    defaultSearchEngine: "youtube",

    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
  },
  new Connectors.DiscordJS(client),
  nodes
);

// ---------------- DEBUG EVENTS ----------------
kazagumo.shoukaku.on("ready", (name) => {
  console.log(`✅ Lavalink connected: ${name}`);
});

kazagumo.shoukaku.on("error", (name, error) => {
  console.log(`❌ Lavalink error (${name}):`, error);
});

// ---------------- IMAGE ROULETTE ----------------
const imageFolder = path.join(__dirname, "images");

// ---------------- READY EVENT ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("Send random roulette image"),

    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play music")
      .addStringOption(option =>
        option
          .setName("song")
          .setDescription("Song name or URL")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("skip")
      .setDescription("Skip song"),

    new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stop music but stay in VC"),

    // ---------------- NEW /QUEUE COMMAND ----------------
    new SlashCommandBuilder()
      .setName("queue")
      .setDescription("View the current music queue"),

  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("✅ Slash commands registered");
});

// ---------------- COMMAND HANDLER ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ---------------- /PRODHAN ----------------
  if (interaction.commandName === "prodhan") {
    const images = fs.readdirSync(imageFolder).filter(f =>
      /\.(png|jpg|jpeg|webp)$/i.test(f)
    );

    if (!images.length)
      return interaction.reply("❌ No images found.");

    const file = images[Math.floor(Math.random() * images.length)];

    return interaction.reply({
      content: "🎰 Roulette!",
      files: [path.join(imageFolder, file)],
    });
  }

  // ---------------- /PLAY ----------------
  if (interaction.commandName === "play") {
    try {
      const query = interaction.options.getString("song");
      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel)
        return interaction.reply("❌ Join a voice channel first.");

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

      const result = await kazagumo.search(query, {
        requester: interaction.user,
      });

      if (!result.tracks.length)
        return interaction.followUp("❌ No songs found.");

      const track = result.tracks[0];

      player.queue.add(track);

      if (!player.playing) {
        await player.play();
      }

      return interaction.followUp(
        `🎵 Now playing: **${track.title}**`
      );

    } catch (err) {
      console.error("PLAY ERROR:", err);
      return interaction.followUp("❌ Failed to play song.");
    }
  }

  // ---------------- /SKIP ----------------
  if (interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player)
      return interaction.reply("❌ No music playing.");

    player.skip();

    return interaction.reply("⏭️ Skipped.");
  }

  // ---------------- /STOP ----------------
  if (interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player)
      return interaction.reply("❌ No music playing.");

    // stops music + clears queue
    player.queue.clear();
    player.skip();

    // stays in VC

    return interaction.reply(
      "🛑 Music stopped. Staying in VC 24/7."
    );
  }

  // ---------------- /QUEUE ----------------
  if (interaction.commandName === "queue") {

    const player = kazagumo.players.get(interaction.guild.id);

    if (!player)
      return interaction.reply("❌ No music playing.");

    const current = player.queue.current;

    const tracks = player.queue;

    let queueMessage = "";

    // CURRENT SONG
    if (current) {
      queueMessage += `🎵 Now Playing:\n**${current.title}**\n\n`;
    }

    // UPCOMING SONGS
    if (!tracks.size) {
      queueMessage += "📭 Queue is empty.";
    } else {

      const upcoming = tracks
        .slice(0, 10)
        .map((track, index) => {
          return `${index + 1}. ${track.title}`;
        })
        .join("\n");

      queueMessage += `📜 Upcoming Songs:\n${upcoming}`;

      if (tracks.size > 10) {
        queueMessage += `\n\n...and ${tracks.size - 10} more songs`;
      }
    }

    return interaction.reply(queueMessage);
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);