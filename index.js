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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
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

// ---------------- ECONOMY DB (PERSISTENT FIX) ----------------
// safe structure so updates NEVER delete balances
async function getUser(id) {
  let user = await db.get(`user_${id}`);

  if (!user || typeof user !== "object") {
    user = {
      wallet: 0,
      bank: 0,
      lastDaily: 0,
      lastWork: 0,
      lastBeg: 0,
    };
    await db.set(`user_${id}`, user);
  }

  return user;
}

async function saveUser(id, data) {
  await db.set(`user_${id}`, data);
}

const getTotal = (u) => u.wallet + u.bank;

// ---------------- COOLDOWN SYSTEM ----------------
const cooldowns = {
  daily: 86400000, // 24h
  work: 30000,     // 30s
  beg: 15000,      // 15s
  coinflip: 5000,
  slots: 5000,
  rob: 10000,
};

function checkCooldown(user, key, duration) {
  const now = Date.now();
  if (!user[key]) user[key] = 0;

  if (now - user[key] < duration) {
    const left = Math.ceil((duration - (now - user[key])) / 1000);
    return left;
  }

  user[key] = now;
  return 0;
}

// ---------------- VC SYSTEM ----------------
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

setInterval(forceRejoinVC, 15000);

// ---------------- READY ----------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder().setName("prodhan").setDescription("🎰 roulette"),

    new SlashCommandBuilder()
      .setName("play")
      .setDescription("🎵 Play music")
      .addStringOption(o =>
        o.setName("song")
          .setDescription("song")
          .setRequired(true)
      ),

    new SlashCommandBuilder().setName("skip").setDescription("skip"),
    new SlashCommandBuilder().setName("stop").setDescription("stop"),
    new SlashCommandBuilder().setName("queue").setDescription("queue"),

    new SlashCommandBuilder().setName("balance").setDescription("balance"),
    new SlashCommandBuilder().setName("daily").setDescription("daily"),
    new SlashCommandBuilder().setName("beg").setDescription("beg"),
    new SlashCommandBuilder().setName("work").setDescription("work"),

    new SlashCommandBuilder()
      .setName("deposit")
      .setDescription("deposit")
      .addIntegerOption(o => o.setName("amount").setDescription("amt").setRequired(true)),

    new SlashCommandBuilder()
      .setName("withdraw")
      .setDescription("withdraw")
      .addIntegerOption(o => o.setName("amount").setDescription("amt").setRequired(true)),

    new SlashCommandBuilder()
      .setName("coinflip")
      .setDescription("coinflip")
      .addIntegerOption(o => o.setName("amount").setDescription("amt").setRequired(true)),

    new SlashCommandBuilder()
      .setName("slots")
      .setDescription("slots")
      .addIntegerOption(o => o.setName("amount").setDescription("amt").setRequired(true)),

    new SlashCommandBuilder().setName("rob").setDescription("rob"),
    new SlashCommandBuilder().setName("leaderboard").setDescription("top"),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );

  console.log("✅ Commands registered");
});

// ---------------- COMMANDS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const u = await getUser(interaction.user.id);

  // ---------------- BALANCE ----------------
  if (interaction.commandName === "balance") {
    return interaction.reply(
      `💰 Wallet: ${u.wallet}\n🏦 Bank: ${u.bank}\n📊 Total: ${getTotal(u)}`
    );
  }

  // ---------------- DAILY ----------------
  if (interaction.commandName === "daily") {
    const cd = checkCooldown(u, "lastDaily", cooldowns.daily);
    if (cd) return interaction.reply(`⏳ wait ${cd}s`);

    u.wallet += 1000;
    await saveUser(interaction.user.id, u);

    return interaction.reply("💸 +1000");
  }

  // ---------------- WORK ----------------
  if (interaction.commandName === "work") {
    const cd = checkCooldown(u, "lastWork", cooldowns.work);
    if (cd) return interaction.reply(`⏳ wait ${cd}s`);

    const amt = Math.floor(Math.random() * 500) + 300;
    u.wallet += amt;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`💼 +${amt}`);
  }

  // ---------------- BEG ----------------
  if (interaction.commandName === "beg") {
    const cd = checkCooldown(u, "lastBeg", cooldowns.beg);
    if (cd) return interaction.reply(`⏳ wait ${cd}s`);

    const amt = Math.floor(Math.random() * 200);
    u.wallet += amt;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`🥺 +${amt}`);
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

  // ---------------- ROB ----------------
  if (interaction.commandName === "rob") {
    const cd = checkCooldown(u, "lastRob", cooldowns.rob);
    if (cd) return interaction.reply(`⏳ wait ${cd}s`);

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
    return interaction.reply(`💰 +${gain}`);
  }

  // ---------------- LEADERBOARD ----------------
  if (interaction.commandName === "leaderboard") {
    const all = await db.all();

    const users = all
      .filter(x => x.id.startsWith("user_"))
      .map(x => ({
        id: x.id.replace("user_", ""),
        total: x.value?.wallet + x.value?.bank || 0,
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