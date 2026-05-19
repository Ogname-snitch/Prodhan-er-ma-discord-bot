require("dotenv").config();

const express = require("express");

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

const { Player } = require("discord-player");

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

const player = new Player(client);

let connection;

// ---------------- READY EVENT ----------------
client.once(Events.ClientReady, async () => {

  console.log(`Logged in as ${client.user.tag}`);

  // ---------------- REGISTER COMMANDS ----------------
  const commands = [
    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("Send image"),

    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play music")
      .addStringOption(option =>
        option
          .setName("song")
          .setDescription("Song name or YouTube link")
          .setRequired(true)
      ),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Slash commands registered!");

  // ---------------- JOIN VC ----------------
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

  // ---------------- /prodhan ----------------
  if (interaction.commandName === "prodhan") {

    return interaction.reply({
      content: "👅👅👅",
      files: ["./images/prodhan.jpeg"],
    });
  }

  // ---------------- /play ----------------
  if (interaction.commandName === "play") {

    const query = interaction.options.getString("song");

    await interaction.reply(`🔍 Searching: **${query}**`);

    try {

      const result = await player.search(query, {
        requestedBy: interaction.user,
      });

      if (!result || !result.tracks.length) {
        return interaction.followUp("❌ No song found.");
      }

      const track = result.tracks[0];

      const queue = player.nodes.create(interaction.guild, {
        metadata: {
          channel: interaction.channel,
        },
        selfDeaf: true,
      });

      if (!queue.connection) {
        await queue.connect(interaction.member.voice.channel);
      }

      queue.addTrack(track);

      if (!queue.node.isPlaying()) {
        await queue.node.play();
      }

      return interaction.followUp(`🎵 Now playing: **${track.title}**`);

    } catch (err) {
      console.error("PLAY ERROR:", err);
      return interaction.followUp("❌ Failed to play song.");
    }
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);