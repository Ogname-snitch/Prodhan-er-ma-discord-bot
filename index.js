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

// ---------------- KAZAGUMO ----------------
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

// ---------------- ECONOMY (PERSISTENT FIX) ----------------
async function getUser(id) {
  let user = await db.get(`user_${id}`);

  // SAFE FIX: prevents reset after updates
  if (!user || typeof user !== "object") {
    user = {
      wallet: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0,
      lastBeg: 0,
    };
  }

  await db.set(`user_${id}`, user);
  return user;
}

async function saveUser(id, data) {
  await db.set(`user_${id}`, data);
}

const getTotal = (u) => u.wallet + u.bank;

// ---------------- COOLDOWNS ----------------
const cooldowns = {
  daily: 86400000,
  work: 30000,
  beg: 15000,
};

// ---------------- VC SYSTEM ----------------
function forceRejoinVC() {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) return;

  if (getVoiceConnection(guild.id)) return;

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });
}

setInterval(forceRejoinVC, 15000);

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

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
      .setName("coinflip")
      .setDescription("🪙 Gamble")
      .addIntegerOption(o =>
        o.setName("amount").setDescription("Bet").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("slots")
      .setDescription("🎰 Slots")
      .addIntegerOption(o =>
        o.setName("amount").setDescription("Bet").setRequired(true)
      ),

    new SlashCommandBuilder().setName("rob").setDescription("🚔 Rob"),
    new SlashCommandBuilder().setName("leaderboard").setDescription("🏆 Top"),
  ].map(c => c.toJSON());

  await new REST({ version: "10" })
    .setToken(process.env.TOKEN)
    .put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

  console.log("✅ Commands registered");
});

// ---------------- COMMANDS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const u = await getUser(interaction.user.id);

  // ---------------- PRODhan ----------------
  if (interaction.commandName === "prodhan") {
    const images = fs.readdirSync(imageFolder)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    if (!images.length)
      return interaction.reply("❌ No images");

    const file = images[Math.floor(Math.random() * images.length)];

    return interaction.reply({
      content: "🎰 Roulette",
      files: [path.join(imageFolder, file)],
    });
  }

  // ---------------- PLAY (FIXED FULL) ----------------
  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");
    const vc = interaction.member.voice.channel;

    if (!vc) return interaction.reply("❌ Join VC first");

    await interaction.reply(`🔍 Searching **${query}**`);

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

    if (!res.tracks.length)
      return interaction.followUp("❌ No songs found");

    const track = res.tracks[0];

    player.queue.add(track);

    if (!player.playing) await player.play();

    return interaction.followUp(`🎵 Now playing **${track.title}**`);
  }

  // ---------------- SKIP/STOP/QUEUE ----------------
  if (interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");
    player.skip();
    return interaction.reply("⏭️ skipped");
  }

  if (interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");
    player.queue.clear();
    player.skip();
    return interaction.reply("🛑 stopped");
  }

  if (interaction.commandName === "queue") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    const current = player.queue.current;
    const q = player.queue;

    let msg = current ? `🎵 Now: **${current.title}**\n\n` : "";
    if (!q.size) return interaction.reply(msg + "📭 Empty");

    msg += q.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join("\n");

    return interaction.reply(msg);
  }

  // ---------------- ECONOMY + COOLDOWN FIX ----------------
  const now = Date.now();

  if (interaction.commandName === "daily") {
    if (now - u.lastDaily < cooldowns.daily)
      return interaction.reply("⏳ daily cooldown");

    u.wallet += 1000;
    u.lastDaily = now;

    await saveUser(interaction.user.id, u);
    return interaction.reply("💸 +1000");
  }

  if (interaction.commandName === "beg") {
    if (now - u.lastBeg < cooldowns.beg)
      return interaction.reply("⏳ wait");

    const amt = Math.floor(Math.random() * 200);
    u.wallet += amt;
    u.lastBeg = now;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`🥺 +${amt}`);
  }

  if (interaction.commandName === "work") {
    if (now - u.lastWork < cooldowns.work)
      return interaction.reply("⏳ wait");

    const amt = Math.floor(Math.random() * 500) + 300;
    u.wallet += amt;
    u.lastWork = now;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`💼 +${amt}`);
  }

  if (interaction.commandName === "balance") {
    return interaction.reply(
      `💰 Wallet: ${u.wallet}\n🏦 Bank: ${u.bank}\n📊 Total: ${getTotal(u)}`
    );
  }

  // ---------------- GAMBLING ----------------
  if (interaction.commandName === "coinflip") {
    const bet = interaction.options.getInteger("amount");
    if (u.wallet < bet) return interaction.reply("❌ no money");

    const win = Math.random() < 0.5;
    u.wallet += win ? bet : -bet;

    await saveUser(interaction.user.id, u);
    return interaction.reply(win ? "🪙 win" : "💀 lose");
  }

  if (interaction.commandName === "slots") {
    const bet = interaction.options.getInteger("amount");
    if (u.wallet < bet) return interaction.reply("❌ no money");

    const e = ["🍒", "🍋", "💎", "7️⃣"];
    const r = [
      e[Math.floor(Math.random() * e.length)],
      e[Math.floor(Math.random() * e.length)],
      e[Math.floor(Math.random() * e.length)],
    ];

    const win = r[0] === r[1] && r[1] === r[2];
    u.wallet += win ? bet * 5 : -bet;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`${r.join(" ")} ${win ? "WIN" : "LOSE"}`);
  }

  if (interaction.commandName === "rob") {
    const success = Math.random() < 0.4;

    if (!success) {
      const fine = Math.floor(Math.random() * 200);
      u.wallet = Math.max(0, u.wallet - fine);
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🚔 -${fine}`);
    }

    const gain = Math.floor(Math.random() * 500);
    u.wallet += gain;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`💰 +${gain}`);
  }

  if (interaction.commandName === "leaderboard") {
    const all = await db.all();

    const users = all
      .filter(x => x.id.startsWith("user_"))
      .map(x => ({
        id: x.id.replace("user_", ""),
        total: x.value.wallet + x.value.bank,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return interaction.reply(
      "🏆 Top:\n" +
      users.map((u, i) => `${i + 1}. <@${u.id}> - ${u.total}`).join("\n")
    );
  }
});

client.login(process.env.TOKEN);