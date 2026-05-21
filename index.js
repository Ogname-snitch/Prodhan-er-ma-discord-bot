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

function getTotal(user) {
  return user.wallet + user.bank;
}

// ---------------- VC STAY SYSTEM ----------------
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
    new SlashCommandBuilder().setName("balance").setDescription("Check balance"),
    new SlashCommandBuilder().setName("daily").setDescription("Daily reward"),
    new SlashCommandBuilder().setName("beg").setDescription("Beg for money"),
    new SlashCommandBuilder().setName("work").setDescription("Work"),

    new SlashCommandBuilder()
      .setName("deposit")
      .setDescription("Deposit money")
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

    new SlashCommandBuilder()
      .setName("withdraw")
      .setDescription("Withdraw money")
      .addIntegerOption(o => o.setName("amount").setRequired(true)),

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
      .setDescription("Try to rob someone"),

    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("Top richest users"),
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );

  console.log("✅ Commands registered");

  forceRejoinVC();
});

// ---------------- COMMANDS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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

    if (last && Date.now() - last < cooldown) {
      const h = Math.floor((cooldown - (Date.now() - last)) / 3600000);
      return interaction.reply(`⏳ Wait ${h}h`);
    }

    const u = await getUser(interaction.user.id);
    const reward = 1000;

    u.wallet += reward;
    await saveUser(interaction.user.id, u);
    await db.set(`daily_${interaction.user.id}`, Date.now());

    return interaction.reply(`💸 +${reward} Tbabcoins`);
  }

  // ---------------- DEPOSIT ----------------
  if (interaction.commandName === "deposit") {
    const amount = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.wallet < amount) return interaction.reply("❌ Not enough money");

    u.wallet -= amount;
    u.bank += amount;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`🏦 Deposited ${amount}`);
  }

  // ---------------- WITHDRAW ----------------
  if (interaction.commandName === "withdraw") {
    const amount = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.bank < amount) return interaction.reply("❌ Not enough bank");

    u.bank -= amount;
    u.wallet += amount;

    await saveUser(interaction.user.id, u);
    return interaction.reply(`💰 Withdrew ${amount}`);
  }

  // ---------------- COINFLIP ----------------
  if (interaction.commandName === "coinflip") {
    const bet = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.wallet < bet) return interaction.reply("❌ Not enough");

    const win = Math.random() < 0.5;

    if (win) {
      u.wallet += bet;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🪙 Won +${bet}`);
    } else {
      u.wallet -= bet;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`💀 Lost -${bet}`);
    }
  }

  // ---------------- SLOTS ----------------
  if (interaction.commandName === "slots") {
    const bet = interaction.options.getInteger("amount");
    const u = await getUser(interaction.user.id);

    if (u.wallet < bet) return interaction.reply("❌ Not enough");

    const e = ["🍒","🍋","🍇","💎","7️⃣"];

    const r = [
      e[Math.floor(Math.random()*e.length)],
      e[Math.floor(Math.random()*e.length)],
      e[Math.floor(Math.random()*e.length)],
    ];

    const win = r[0] === r[1] && r[1] === r[2];

    if (win) {
      u.wallet += bet * 5;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🎰 ${r.join(" ")} JACKPOT!`);
    } else {
      u.wallet -= bet;
      await saveUser(interaction.user.id, u);
      return interaction.reply(`🎰 ${r.join(" ")} Lost`);
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
      return interaction.reply(`🚔 Caught! Lost ${fine}`);
    }

    const gain = Math.floor(Math.random() * 500);
    u.wallet += gain;
    await saveUser(interaction.user.id, u);

    return interaction.reply(`💰 Stole ${gain} Tbabcoins`);
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

    const msg = users
      .map((u, i) => `${i + 1}. <@${u.id}> - ${u.total}`)
      .join("\n");

    return interaction.reply(`🏆 Top Users:\n${msg}`);
  }
});

client.login(process.env.TOKEN);