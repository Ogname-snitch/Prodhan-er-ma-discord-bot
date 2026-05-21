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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { joinVoiceChannel, getVoiceConnection } = require("@discordjs/voice");

const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

const { QuickDB } = require("quick.db");
const db = new QuickDB();

// ---------------- EXPRESS ----------------
const app = express();
app.get("/", (req, res) => res.send("Bot is alive!"));
app.listen(process.env.PORT || 3000, () => console.log("Web server running"));

// ---------------- DISCORD ----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// ---------------- LAVALINK ----------------
const nodes = [
  {
    name: "Lavalink-1",
    url: process.env.LAVALINK_HOST,
    auth: process.env.LAVALINK_PASSWORD,
    secure: false,
  },
];

// ---------------- MUSIC ----------------
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

// ---------------- IMAGE ----------------
const imageFolder = path.join(__dirname, "images");

// ---------------- ECONOMY ----------------
async function getUser(id) {
  let user = await db.get(`user_${id}`);

  if (!user || typeof user !== "object") {
    user = { wallet: 0, lastDaily: 0, lastWork: 0, lastBeg: 0 };
  }

  await db.set(`user_${id}`, user);
  return user;
}

async function saveUser(id, data) {
  await db.set(`user_${id}`, data);
}

// ---------------- COOLDOWNS ----------------
const cooldowns = {
  daily: 86400000,
  work: 30000,
  beg: 15000,
};

const stealCooldown = new Map();

// ---------------- VC (NEVER LEAVE FIX) ----------------
function forceRejoinVC() {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) return;

  const connection = getVoiceConnection(guild.id);

  // ALWAYS stay connected
  if (!connection) {
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });
  }
}

setInterval(forceRejoinVC, 15000);

// ---------------- BLACKJACK SYSTEM ----------------
const blackjackGames = new Map();

function drawCard() {
  return Math.floor(Math.random() * 11) + 1;
}

function calcHand(hand) {
  return hand.reduce((a, b) => a + b, 0);
}

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "beating prodhan", type: 0 }],
    status: "online",
  });

  const commands = [
    new SlashCommandBuilder().setName("prodhan").setDescription("🎰 Image"),

    new SlashCommandBuilder()
      .setName("play")
      .setDescription("🎵 Play music")
      .addStringOption(o =>
        o.setName("song").setDescription("Song").setRequired(true)
      ),

    new SlashCommandBuilder().setName("skip").setDescription("⏭️ Skip"),
    new SlashCommandBuilder().setName("stop").setDescription("🛑 Stop"),
    new SlashCommandBuilder().setName("queue").setDescription("📜 Queue"),

    new SlashCommandBuilder().setName("balance").setDescription("💰 Balance"),
    new SlashCommandBuilder().setName("daily").setDescription("🎁 Daily"),
    new SlashCommandBuilder().setName("beg").setDescription("🥺 Beg"),
    new SlashCommandBuilder().setName("work").setDescription("💼 Work"),

    new SlashCommandBuilder()
      .setName("transfer")
      .setDescription("💸 Transfer")
      .addUserOption(o =>
        o.setName("user").setDescription("Target").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount").setDescription("Amount").setRequired(true)
      ),

    new SlashCommandBuilder().setName("leaderboard").setDescription("🏆 Top"),

    new SlashCommandBuilder()
      .setName("blackjack")
      .setDescription("🃏 Blackjack")
      .addIntegerOption(o =>
        o.setName("bet").setDescription("Bet").setRequired(true)
      ),
  ].map(c => c.toJSON());

  await new REST({ version: "10" })
    .setToken(process.env.TOKEN)
    .put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

  console.log("✅ Commands registered");
});

// ---------------- INTERACTIONS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  const u = await getUser(interaction.user.id);

  // ================= PRODHAN SAFE =================
  if (interaction.isChatInputCommand() && interaction.commandName === "prodhan") {
    const images = fs.existsSync(imageFolder)
      ? fs.readdirSync(imageFolder).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      : [];

    if (!images.length)
      return interaction.reply("❌ No images found");

    const file = images[Math.floor(Math.random() * images.length)];

    return interaction.reply({
      content: "🎰 Roulette",
      files: [path.join(imageFolder, file)],
    });
  }

  // ================= PLAY FIX =================
  if (interaction.isChatInputCommand() && interaction.commandName === "play") {
    const query = interaction.options.getString("song");
    const vc = interaction.member.voice.channel;

    if (!vc) return interaction.reply("❌ Join VC first");

    await interaction.reply(`🔍 Searching **${query}**`);

    try {
      let player = kazagumo.players.get(interaction.guild.id);

      if (!player) {
        player = await kazagumo.createPlayer({
          guildId: interaction.guild.id,
          textId: interaction.channel.id,
          voiceId: vc.id,
          deaf: true,
        });
      }

      const res = await kazagumo.search(query, { requester: interaction.user });

      if (!res?.tracks?.length)
        return interaction.followUp("❌ No songs found");

      const track = res.tracks[0];

      player.queue.add(track);

      if (!player.playing) await player.play();

      return interaction.followUp(`🎵 Now playing **${track.title}**`);
    } catch (err) {
      console.log(err);
      return interaction.followUp("❌ Music error");
    }
  }

  // ================= SKIP FIX =================
  if (interaction.isChatInputCommand() && interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player) return interaction.reply("❌ No music");

    try {
      await player.skip();
      return interaction.reply("⏭️ Skipped");
    } catch (e) {
      return interaction.reply("❌ Skip failed");
    }
  }

  // ================= STOP FIX (NO VC LEAVE) =================
  if (interaction.isChatInputCommand() && interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player) return interaction.reply("❌ No music");

    player.queue.clear();

    if (player.playing) {
      try {
        await player.skip();
      } catch {}
    }

    return interaction.reply("🛑 Stopped (bot stays in VC)");
  }

  // ================= QUEUE =================
  if (interaction.isChatInputCommand() && interaction.commandName === "queue") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player) return interaction.reply("❌ No music");

    const current = player.queue.current;
    const q = player.queue;

    let msg = current ? `🎵 Now: **${current.title}**\n\n` : "";
    if (!q.size) return interaction.reply(msg + "📭 Empty");

    msg += q.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join("\n");

    return interaction.reply(msg);
  }

  // ================= ECONOMY =================
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "balance")
      return interaction.reply(`💰 ${u.wallet}`);

    if (interaction.commandName === "daily") {
      u.wallet += 1000;
      await saveUser(interaction.user.id, u);
      return interaction.reply("💸 +1000");
    }

    if (interaction.commandName === "beg") {
      const a = Math.floor(Math.random() * 200);
      u.wallet += a;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🥺 +${a}`);
    }

    if (interaction.commandName === "work") {
      const a = Math.floor(Math.random() * 500) + 300;
      u.wallet += a;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`💼 +${a}`);
    }

    if (interaction.commandName === "transfer") {
      const t = interaction.options.getUser("user");
      const a = interaction.options.getInteger("amount");

      if (u.wallet < a) return interaction.reply("❌ not enough money");

      const target = await getUser(t.id);

      u.wallet -= a;
      target.wallet += a;

      await saveUser(interaction.user.id, u);
      await saveUser(t.id, target);

      return interaction.reply(`💸 sent ${a} to <@${t.id}>`);
    }

    if (interaction.commandName === "leaderboard") {
      const all = await db.all();

      const users = all
        .filter(x => x.id.startsWith("user_"))
        .map(x => ({
          id: x.id.replace("user_", ""),
          total: x.value.wallet || 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      return interaction.reply(
        "🏆 Top:\n" +
        users.map((u, i) => `${i + 1}. <@${u.id}> - ${u.total}`).join("\n")
      );
    }
  }
});

client.login(process.env.TOKEN);