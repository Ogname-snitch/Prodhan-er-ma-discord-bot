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

// ---------------- STEAL COOLDOWNS ----------------
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

// ---------------- BOT STATUS ----------------
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
      .setDescription("💸 Transfer money")
      .addUserOption(o =>
        o.setName("user").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("coinflip")
      .setDescription("🪙 Gamble")
      .addIntegerOption(o =>
        o.setName("amount").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("slots")
      .setDescription("🎰 Slots")
      .addIntegerOption(o =>
        o.setName("amount").setRequired(true)
      ),

    new SlashCommandBuilder().setName("rob").setDescription("🚔 Rob"),

    new SlashCommandBuilder()
      .setName("steal")
      .setDescription("🕵️ Steal from someone")
      .addUserOption(o =>
        o.setName("user").setRequired(true)
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

// ---------------- COMMANDS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const u = await getUser(interaction.user.id);
  const now = Date.now();

  // ---------------- PLAY FIX ----------------
  if (interaction.commandName === "play") {
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
    } catch (e) {
      console.log(e);
      return interaction.followUp("❌ Music error occurred");
    }
  }

  // ---------------- STEAL SYSTEM + COOLDOWN ----------------
  if (interaction.commandName === "steal") {
    const target = interaction.options.getUser("user");
    const targetData = await getUser(target.id);

    if (target.bot) return interaction.reply("❌ bots cannot be stolen from");
    if (targetData.wallet <= 0) return interaction.reply("❌ empty wallet");

    const thiefId = interaction.user.id;

    if (stealCooldown.has(thiefId)) {
      const cd = stealCooldown.get(thiefId);
      if (Date.now() < cd) {
        return interaction.reply("⏳ You are on steal cooldown");
      }
    }

    await interaction.reply(`🕵️ Attempting steal on <@${target.id}>`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("defend")
        .setLabel("🛡️ DEFEND (5s)")
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await interaction.followUp({
      content: `⚠️ <@${target.id}> DEFEND NOW!`,
      components: [row],
      fetchReply: true,
    });

    let defended = false;

    const collector = msg.createMessageComponentCollector({ time: 5000 });

    collector.on("collect", async (btn) => {
      if (btn.user.id === target.id) {
        defended = true;
        stealCooldown.set(thiefId, Date.now() + 5 * 60 * 1000);

        await btn.reply({
          content: "🛡️ SAFE! You defended successfully.",
          ephemeral: true,
        });
      }
    });

    collector.on("end", async () => {
      if (defended) {
        await interaction.followUp("🛡️ Target is safe. Thief got 5 min cooldown.");
        return;
      }

      const amount = Math.floor(targetData.wallet * (Math.random() * 0.5 + 0.1));

      targetData.wallet -= amount;
      u.wallet += amount;

      stealCooldown.set(thiefId, Date.now() + 60 * 1000);

      await saveUser(target.id, targetData);
      await saveUser(thiefId, u);

      await interaction.followUp(`💰 You stole ${amount} coins from <@${target.id}>`);
    });
  }

  // ---------------- TRANSFER ----------------
  if (interaction.commandName === "transfer") {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (target.id === interaction.user.id)
      return interaction.reply("❌ self transfer blocked");

    if (u.wallet < amount)
      return interaction.reply("❌ not enough money");

    const t = await getUser(target.id);

    u.wallet -= amount;
    t.wallet += amount;

    await saveUser(interaction.user.id, u);
    await saveUser(target.id, t);

    return interaction.reply(`💸 Sent ${amount} to <@${target.id}>`);
  }

  // ---------------- OTHER COMMANDS (UNCHANGED) ----------------
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