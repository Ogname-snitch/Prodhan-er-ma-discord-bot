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
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

const play = require("play-dl");

// ---------------- EXPRESS ----------------
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
const player = createAudioPlayer();

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // REGISTER COMMANDS
  const commands = [
    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("Sends image"),

    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play music from YouTube")
      .addStringOption(option =>
        option
          .setName("song")
          .setDescription("Song name or YouTube URL")
          .setRequired(true)
      ),
  ].map(command => command.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Slash commands registered!");

  // JOIN VC
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  if (!guild) return;

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

  if (!channel) return;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  connection.subscribe(player);

  console.log("Joined VC");
});

// ---------------- COMMANDS ----------------
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // /prodhan
  if (interaction.commandName === "prodhan") {
    await interaction.reply({
      content: "Here you go 👇",
      files: [
        "https://i.imgur.com/yourImage.png"
      ],
    });
  }

  // /play
  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");

    await interaction.reply(`Searching for: ${query}`);

    try {
      const search = await play.search(query, { limit: 1 });

      if (!search.length) {
        return interaction.followUp("No results found.");
      }

      const stream = await play.stream(search[0].url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      player.play(resource);

      interaction.followUp(`🎵 Playing: ${search[0].title}`);
    } catch (err) {
      console.error(err);
      interaction.followUp("Error playing song.");
    }
  }
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);