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
      guild.shard?.send(payload);
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

// ---------------- BLACKJACK ----------------
const blackjack = new Map();

function draw() {
  return Math.floor(Math.random() * 11) + 1;
}

function sum(a) {
  return a.reduce((x, y) => x + y, 0);
}

// ---------------- VC AUTO JOIN (NO LEAVE EVER) ----------------
function stayInVC() {
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

setInterval(stayInVC, 15000);

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

    new SlashCommandBuilder().setName("slots").setDescription("🎰 Slots"),

    new SlashCommandBuilder()
      .setName("transfer")
      .setDescription("💸 Transfer")
      .addUserOption(o =>
        o.setName("user").setDescription("Target").setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount").setDescription("Amount").setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("steal")
      .setDescription("🕵️ Steal")
      .addUserOption(o =>
        o.setName("user").setDescription("Target").setRequired(true)
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

  // ---------------- PRODhan ----------------
  if (interaction.commandName === "prodhan") {
    const images = fs.existsSync(imageFolder)
      ? fs.readdirSync(imageFolder).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      : [];

    if (!images.length) return interaction.reply("❌ No images");

    const file = images[Math.floor(Math.random() * images.length)];

    return interaction.reply({
      content: "🎰 Roulette",
      files: [path.join(imageFolder, file)],
    });
  }

  // ---------------- PLAY ----------------
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
      return interaction.followUp("❌ Music error");
    }
  }

  // ---------------- SKIP ----------------
  if (interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    await player.skip();
    return interaction.reply("⏭️ Skipped (stays in VC)");
  }

  // ---------------- STOP ----------------
  if (interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    player.queue.clear();
    await player.skip();

    return interaction.reply("🛑 Stopped (NO VC LEAVE)");
  }

  // ---------------- QUEUE ----------------
  if (interaction.commandName === "queue") {
    const player = kazagumo.players.get(interaction.guild.id);
    if (!player) return interaction.reply("❌ No music");

    const q = player.queue;
    const current = q.current;

    let msg = current ? `🎵 Now: **${current.title}**\n\n` : "";
    if (!q.size) return interaction.reply(msg + "📭 Empty");

    msg += q.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join("\n");

    return interaction.reply(msg);
  }

  // ---------------- ECONOMY ----------------
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

  // ---------------- TRANSFER ----------------
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

  // ---------------- STEAL ----------------
  if (interaction.commandName === "steal") {
    const t = interaction.options.getUser("user");
    const target = await getUser(t.id);

    if (target.wallet <= 0) return interaction.reply("❌ empty wallet");

    const amount = Math.floor(target.wallet * Math.random());

    target.wallet -= amount;
    u.wallet += amount;

    await saveUser(t.id, target);
    await saveUser(interaction.user.id, u);

    return interaction.reply(`🕵️ stole ${amount} coins from <@${t.id}>`);
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

  // ---------------- BLACKJACK ----------------
  if (interaction.commandName === "blackjack") {
    const bet = interaction.options.getInteger("bet");

    if (u.wallet < bet) return interaction.reply("❌ Not enough money");

    const player = [draw(), draw()];
    const dealer = [draw(), draw()];

    blackjack.set(interaction.user.id, { bet, player, dealer });

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
    const game = blackjack.get(interaction.user.id);
    if (!game) return interaction.reply({ content: "❌ No game", ephemeral: true });

    const p = game.player;
    const d = game.dealer;

    if (interaction.customId === "hit") {
      p.push(draw());

      if (sum(p) > 21) {
        blackjack.delete(interaction.user.id);
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
      while (sum(d) < 17) d.push(draw());

      const ps = sum(p);
      const ds = sum(d);

      blackjack.delete(interaction.user.id);

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