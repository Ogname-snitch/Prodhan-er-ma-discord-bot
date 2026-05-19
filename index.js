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
} = require("@discordjs/voice");

const play = require("play-dl");

(async () => {
  await play.setToken({
    youtube: {
      cookie: process.env.YT_COOKIE || null
    }
  });
})();

const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;

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
const player = createAudioPlayer();

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
      .setDescription("Play music from YouTube or search")
      .addStringOption(option =>
        option
          .setName("song")
          .setDescription("Song name or YouTube link")
          .setRequired(true)
      ),

  ].map(command => command.toJSON());

  const rest = new REST({ version: "10" })
    .setToken(process.env.TOKEN);

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

    console.error("Command registration error:", err);

  }

  // ---------------- JOIN VC ----------------
  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  if (!guild) {
    console.log("Guild not found");
    return;
  }

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

  if (!channel) {
    console.log("Voice channel not found");
    return;
  }

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  connection.subscribe(player);

  console.log("Joined VC successfully");

});

// ---------------- COMMAND HANDLER ----------------
client.on(Events.InteractionCreate, async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  // ---------------- /prodhan ----------------
  if (interaction.commandName === "prodhan") {

    await interaction.reply({
      content: "👅👅👅",
      files: [
        "./images/prodhan.jpeg"
      ],
    });

  }

  // ---------------- /play ----------------
  if (interaction.commandName === "play") {

  const query = interaction.options.getString("song");

  await interaction.reply(`🔍 Searching: ${query}`);

  try {

    let url;

    if (query.includes("http")) {
      url = query;
    } else {

      const results = await play.search(query, { limit: 1 });

      if (!results || results.length === 0) {
        return interaction.followUp("❌ Song not found.");
      }

      url = results[0].url;
    }

    const stream = await play.stream(url);

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    player.play(resource);

    if (connection) connection.subscribe(player);

    const info = await play.video_basic_info(url);

    return interaction.followUp(`🎵 Now playing: ${info.video_details.title}`);

  } catch (err) {

    console.error("PLAY ERROR:", err);

    return interaction.followUp(
      `❌ Error: ${err.message || "unknown error"}`
    );
  }
}
});

// ---------------- LOGIN ----------------
client.login(process.env.TOKEN);