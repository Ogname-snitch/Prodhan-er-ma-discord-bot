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
      if (!guild) return;
      try {
        guild.shard?.send(payload);
      } catch (e) {
        console.log("Shard send error:", e);
      }
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
  if (!user || typeof user !== "object") user = { wallet: 0 };
  await db.set(`user_${id}`, user);
  return user;
}

async function saveUser(id, data) {
  await db.set(`user_${id}`, data);
}

// ---------------- BLACKJACK ----------------
const blackjackGames = new Map();

function drawCard() {
  return Math.floor(Math.random() * 11) + 1;
}

function sum(hand) {
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

    new SlashCommandBuilder().setName("slots").setDescription("🎰 Slots"),

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
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

  console.log("✅ Commands registered");
});

// ---------------- INTERACTIONS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  const u = await getUser(interaction.user.id);

  // ---------------- PRODHAN ----------------
  if (interaction.isChatInputCommand() && interaction.commandName === "prodhan") {
    const images = fs.existsSync(imageFolder)
      ? fs.readdirSync(imageFolder).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      : [];

    if (!images.length) return interaction.reply("❌ No images found");

    const file = images[Math.floor(Math.random() * images.length)];

    return interaction.reply({
      content: "🎰 Roulette",
      files: [path.join(imageFolder, file)],
    });
  }

  // ---------------- PLAY ----------------
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
    } catch (e) {
      console.log("PLAY ERROR:", e);
      return interaction.followUp("❌ Music error");
    }
  }

  // ---------------- SKIP ----------------
  if (interaction.isChatInputCommand() && interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    try {
      await player.skip();
      return interaction.reply("⏭️ Skipped (stays in VC)");
    } catch {
      return interaction.reply("❌ Skip failed");
    }
  }

  // ---------------- STOP (NO VC LEAVE) ----------------
  if (interaction.isChatInputCommand() && interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    player.queue.clear();
    await player.skip();

    return interaction.reply("🛑 Stopped (still in VC)");
  }

  // ---------------- QUEUE ----------------
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

  // ---------------- BALANCE ----------------
  if (interaction.commandName === "balance") {
    return interaction.reply(`💰 ${u.wallet}`);
  }

  // ---------------- SLOTS ----------------
  if (interaction.commandName === "slots") {
    const r = ["🍒", "🍋", "💎", "🍊"];
    const a = r[Math.floor(Math.random() * r.length)];
    const b = r[Math.floor(Math.random() * r.length)];
    const c = r[Math.floor(Math.random() * r.length)];

    const win = a === b && b === c;

    if (win) u.wallet += 500;
    else u.wallet -= 100;

    await saveUser(interaction.user.id, u);

    return interaction.reply(`${a} | ${b} | ${c}\n${win ? "WIN +500" : "LOSE -100"}`);
  }

  // ---------------- BLACKJACK ----------------
  if (interaction.commandName === "blackjack") {
    const bet = interaction.options.getInteger("bet");

    if (u.wallet < bet) return interaction.reply("❌ Not enough money");

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];

    blackjackGames.set(interaction.user.id, { bet, player, dealer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hit").setLabel("HIT").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("stand").setLabel("STAND").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: `🃏 You: ${sum(player)} | Dealer: ${dealer[0]}`,
      components: [row],
    });
  }

  // ---------------- BLACKJACK BUTTONS ----------------
  if (interaction.isButton()) {
    const game = blackjackGames.get(interaction.user.id);
    if (!game) return interaction.reply({ content: "❌ No game", ephemeral: true });

    const p = game.player;
    const d = game.dealer;

    if (interaction.customId === "hit") {
      p.push(drawCard());

      if (sum(p) > 21) {
        blackjackGames.delete(interaction.user.id);
        u.wallet -= game.bet;
        await saveUser(interaction.user.id, u);

        return interaction.update({
          content: `💥 Bust! You lost ${game.bet}`,
          components: [],
        });
      }

      return interaction.update({
        content: `🃏 You: ${sum(p)} | Dealer: ${d[0]}`,
        components: interaction.message.components,
      });
    }

    if (interaction.customId === "stand") {
      while (sum(d) < 17) d.push(drawCard());

      const ps = sum(p);
      const ds = sum(d);

      blackjackGames.delete(interaction.user.id);

      if (ds > 21 || ps > ds) u.wallet += game.bet;
      else if (ps < ds) u.wallet -= game.bet;

      await saveUser(interaction.user.id, u);

      return interaction.update({
        content: `🃏 You: ${ps} | Dealer: ${ds}`,
        components: [],
      });
    }
  }
});

client.login(process.env.TOKEN);