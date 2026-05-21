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
    user = {
      wallet: 0,
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

// ---------------- COOLDOWNS ----------------
const cooldowns = {
  daily: 86400000,
  work: 30000,
  beg: 15000,
};

const stealCooldown = new Map();

// ---------------- VC ----------------
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

  // STATUS FIX
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
      .setDescription("💸 Transfer money")
      .addUserOption(o =>
        o.setName("user").setDescription("Target").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount").setDescription("Amount").setRequired(true)
      ),

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

    new SlashCommandBuilder()
      .setName("steal")
      .setDescription("🕵️ Steal")
      .addUserOption(o =>
        o.setName("user").setDescription("Target").setRequired(true)
      ),

    // 🃏 BLACKJACK ADDED
    new SlashCommandBuilder()
      .setName("blackjack")
      .setDescription("🃏 Play blackjack")
      .addIntegerOption(o =>
        o.setName("amount").setDescription("Bet").setRequired(true)
      ),

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

// ---------------- BLACKJACK ----------------
const bj = new Map();

function draw() {
  return Math.floor(Math.random() * 11) + 1;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const u = await getUser(interaction.user.id);
  const now = Date.now();

  // ---------------- BLACKJACK ----------------
  if (interaction.commandName === "blackjack") {
    const bet = interaction.options.getInteger("amount");

    if (u.wallet < bet) return interaction.reply("❌ Not enough money");

    let player = draw() + draw();
    let dealer = draw() + draw();

    while (player < 16) player += draw();
    while (dealer < 17) dealer += draw();

    let result;

    if (player > 21) result = "lose";
    else if (dealer > 21 || player > dealer) result = "win";
    else if (player === dealer) result = "tie";
    else result = "lose";

    if (result === "win") u.wallet += bet;
    if (result === "lose") u.wallet -= bet;

    await saveUser(interaction.user.id, u);

    return interaction.reply(
      `🃏 You: ${player} | Dealer: ${dealer}\nResult: **${result.toUpperCase()}**`
    );
  }

  // ---------------- ALL OLD COMMANDS (UNCHANGED CORE) ----------------

  if (interaction.commandName === "balance")
    return interaction.reply(`💰 Wallet: ${u.wallet}`);

  if (interaction.commandName === "daily") {
    if (now - u.lastDaily < cooldowns.daily)
      return interaction.reply("⏳ cooldown");

    u.wallet += 1000;
    u.lastDaily = now;
    await saveUser(interaction.user.id, u);
    return interaction.reply("💸 +1000");
  }

  if (interaction.commandName === "beg") {
    const amt = Math.floor(Math.random() * 200);
    u.wallet += amt;
    await saveUser(interaction.user.id, u);
    return interaction.reply(`🥺 +${amt}`);
  }

  if (interaction.commandName === "work") {
    const amt = Math.floor(Math.random() * 500) + 300;
    u.wallet += amt;
    await saveUser(interaction.user.id, u);
    return interaction.reply(`💼 +${amt}`);
  }

  if (interaction.commandName === "transfer") {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (u.wallet < amount) return interaction.reply("❌ not enough money");

    const t = await getUser(target.id);

    u.wallet -= amount;
    t.wallet += amount;

    await saveUser(interaction.user.id, u);
    await saveUser(target.id, t);

    return interaction.reply(`💸 sent ${amount} to <@${target.id}>`);
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
});

client.login(process.env.TOKEN);