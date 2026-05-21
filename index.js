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

// ---------------- ECONOMY ----------------
async function getUser(id) {
  let user = await db.get(`user_${id}`);
  if (!user) {
    user = { wallet: 0, bank: 0 };
    await db.set(`user_${id}`, user);
  }
  return user;
}

async function saveUser(id, data) {
  await db.set(`user_${id}`, data);
}

const getTotal = (u) => u.wallet + u.bank;

// ---------------- 24/7 VC SYSTEM ----------------
function forceRejoinVC() {
  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) return;

  const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
  if (!channel) return;

  const existing = getVoiceConnection(guild.id);
  if (existing) return;

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });
}

// keeps checking every 15s
setInterval(forceRejoinVC, 15000);

// extra safety: rejoin if disconnected
client.on("voiceStateUpdate", () => {
  setTimeout(forceRejoinVC, 2000);
});

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [

    // IMAGE
    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("Send random roulette image"),

    // MUSIC
    new SlashCommandBuilder()
      .setName("play")
      .setDescription("Play music")
      .addStringOption(o =>
        o.setName("song").setDescription("Song").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("skip")
      .setDescription("Skip song"),

    new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stop music but stay in VC"),

    new SlashCommandBuilder()
      .setName("queue")
      .setDescription("View queue"),

    // ECONOMY
    new SlashCommandBuilder().setName("balance").setDescription("Check balance"),
    new SlashCommandBuilder().setName("daily").setDescription("Daily reward"),
    new SlashCommandBuilder().setName("beg").setDescription("Beg money"),
    new SlashCommandBuilder().setName("work").setDescription("Work"),

    new SlashCommandBuilder()
      .setName("deposit")
      .setDescription("Deposit money")
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
      .setName("withdraw")
      .setDescription("Withdraw money")
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    // GAMBLING
    new SlashCommandBuilder()
      .setName("coinflip")
      .setDescription("50/50 gamble")
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
      .setName("slots")
      .setDescription("Slot machine")
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
      .setName("rob")
      .setDescription("Try robbing"),

    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("Top richest users"),

  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("✅ Commands registered");

  forceRejoinVC();
});

// ---------------- COMMAND HANDLER ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ---------------- PRODhan ----------------
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

  // ---------------- PLAY ----------------
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

    const res = await kazagumo.search(query, {
      requester: interaction.user,
    });

    if (!res.tracks.length)
      return interaction.followUp("❌ No songs");

    const track = res.tracks[0];

    player.queue.add(track);

    if (!player.playing) await player.play();

    return interaction.followUp(`🎵 Now playing **${track.title}**`);
  }

  // ---------------- SKIP ----------------
  if (interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");
    player.skip();
    return interaction.reply("⏭️ skipped");
  }

  // ---------------- STOP ----------------
  if (interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    player.queue.clear();
    player.skip();

    return interaction.reply("🛑 stopped (staying in VC)");
  }

  // ---------------- QUEUE ----------------
  if (interaction.commandName === "queue") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    const current = player.queue.current;
    const q = player.queue;

    let msg = current ? `🎵 Now: **${current.title}**\n\n` : "";

    if (!q.size) return interaction.reply(msg + "📭 Empty queue");

    msg += q.slice(0, 10)
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join("\n");

    return interaction.reply(msg);
  }

  // ---------------- BALANCE ----------------
  if (interaction.commandName === "balance") {
    const u = await getUser(interaction.user.id);
    return interaction.reply(
      `💰 Wallet: ${u.wallet} Tbabcoins\n🏦 Bank: ${u.bank} Tbabcoins\n📊 Total: ${getTotal(u)}`
    );
  }

  // ---------------- DAILY ----------------
  if (interaction.commandName === "daily") {
    const cooldown = 86400000;
    const last = await db.get(`daily_${interaction.user.id}`);

    if (last && Date.now() - last < cooldown)
      return interaction.reply("⏳ wait");

    const u = await getUser(interaction.user.id);
    u.wallet += 1000;

    await saveUser(interaction.user.id, u);
    await db.set(`daily_${interaction.user.id}`, Date.now());

    return interaction.reply("💸 +1000 Tbabcoins");
  }

  // ---------------- BEG ----------------
  if (interaction.commandName === "beg") {
    const u = await getUser(interaction.user.id);
    const amt = Math.floor(Math.random() * 200) + 50;

    u.wallet += amt;
    await saveUser(interaction.user.id, u);

    return interaction.reply(`🥺 +${amt}`);
  }

  // ---------------- WORK ----------------
  if (interaction.commandName === "work") {
    const jobs = ["Dev", "Chef", "Driver", "Streamer"];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const amt = Math.floor(Math.random() * 500) + 300;

    const u = await getUser(interaction.user.id);
    u.wallet += amt;

    await saveUser(interaction.user.id, u);

    return interaction.reply(`💼 ${job} +${amt}`);
  }

  // ---------------- DEPOSIT ----------------
  if (interaction.commandName === "deposit") {
    const amt = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.wallet < amt) return interaction.reply("❌ no money");

    u.wallet -= amt;
    u.bank += amt;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`🏦 deposited ${amt}`);
  }

  // ---------------- WITHDRAW ----------------
  if (interaction.commandName === "withdraw") {
    const amt = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.bank < amt) return interaction.reply("❌ not enough bank");

    u.bank -= amt;
    u.wallet += amt;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`💰 withdrew ${amt}`);
  }

  // ---------------- COINFLIP ----------------
  if (interaction.commandName === "coinflip") {
    const bet = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.wallet < bet) return interaction.reply("❌ no money");

    const win = Math.random() < 0.5;

    if (win) {
      u.wallet += bet;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🪙 won ${bet}`);
    } else {
      u.wallet -= bet;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`💀 lost ${bet}`);
    }
  }

  // ---------------- SLOTS ----------------
  if (interaction.commandName === "slots") {
    const bet = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.wallet < bet) return interaction.reply("❌ no money");

    const e = ["🍒","🍋","💎","7️⃣"];
    const r = [
      e[Math.floor(Math.random()*e.length)],
      e[Math.floor(Math.random()*e.length)],
      e[Math.floor(Math.random()*e.length)],
    ];

    const win = r[0] === r[1] && r[1] === r[2];

    if (win) {
      u.wallet += bet * 5;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🎰 ${r.join(" ")} JACKPOT`);
    } else {
      u.wallet -= bet;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🎰 ${r.join(" ")} lost`);
    }
  }

  // ---------------- ROB ----------------
  if (interaction.commandName === "rob") {
    const u = await getUser(interaction.user.id);

    const success = Math.random() < 0.4;

    if (!success) {
      const fine = Math.floor(Math.random() * 200);
      u.wallet = Math.max(0, u.wallet - fine);
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🚔 caught -${fine}`);
    }

    const gain = Math.floor(Math.random() * 500);
    u.wallet += gain;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`💰 stole ${gain}`);
  }

  // ---------------- LEADERBOARD ----------------
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
      "🏆 Top Users:\n" +
      users.map((u, i) => `${i+1}. <@${u.id}> - ${u.total}`).join("\n")
    );
  }
});

client.login(process.env.TOKEN);