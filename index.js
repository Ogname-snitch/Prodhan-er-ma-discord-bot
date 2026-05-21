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

// ---------------- STEAL COOLDOWN ----------------
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

  // ✅ BOT STATUS FIX
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

    // TRANSFER
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
      .setDescription("🕵️ Steal from someone")
      .addUserOption(o =>
        o.setName("user").setDescription("Target").setRequired(true)
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

  // ---------------- PLAY (FIXED NO STUCK) ----------------
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
    } catch (err) {
      console.log(err);
      return interaction.followUp("❌ Music error");
    }
  }

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

  // ---------------- ECONOMY ----------------
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

  // ---------------- TRANSFER ----------------
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

  // ---------------- STEAL ----------------
  if (interaction.commandName === "steal") {
    const target = interaction.options.getUser("user");
    const targetData = await getUser(target.id);

    if (target.bot) return interaction.reply("❌ bots cannot be stolen");
    if (targetData.wallet <= 0) return interaction.reply("❌ empty wallet");

    const thiefId = interaction.user.id;

    if (stealCooldown.has(thiefId)) {
      if (Date.now() < stealCooldown.get(thiefId))
        return interaction.reply("⏳ steal cooldown active");
    }

    await interaction.reply(`🕵️ Stealing from <@${target.id}>...`);

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
        await btn.reply({ content: "🛡️ SAFE!", ephemeral: true });
      }
    });

    collector.on("end", async () => {
      if (defended) {
        await interaction.followUp("🛡️ Target defended.");
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

  // ---------------- LEADERBOARD ----------------
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