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

app.listen(process.env.PORT || 3000, () => {
  console.log("Web server running");
});

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

// ---------------- LAVALINK ERROR FIX ----------------
kazagumo.shoukaku.on("ready", (name) => {
  console.log(`${name} Lavalink ready`);
});

kazagumo.shoukaku.on("error", (name, error) => {
  console.log(`Lavalink error (${name}):`, error);
});

kazagumo.shoukaku.on("close", (name, code, reason) => {
  console.log(`Lavalink closed (${name}) ${code} ${reason}`);
});

kazagumo.shoukaku.on("disconnect", (name, players, moved) => {
  console.log(`Lavalink disconnected (${name})`);
});

// PREVENT BOT CRASH
process.on("unhandledRejection", (reason) => {
  console.log("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});

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
  steal: 60000,
};

// ---------------- BLACKJACK ----------------
const blackjack = new Map();

function draw() {
  return Math.floor(Math.random() * 11) + 1;
}

function sum(a) {
  return a.reduce((x, y) => x + y, 0);
}

// ---------------- VC AUTO JOIN ----------------
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
    // ---------------- IMAGE ----------------
    new SlashCommandBuilder()
      .setName("prodhan")
      .setDescription("🎰 Image"),

    // ---------------- MUSIC ----------------
    new SlashCommandBuilder()
      .setName("play")
      .setDescription("🎵 Play music")
      .addStringOption(o =>
        o.setName("song")
          .setDescription("Song")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("skip")
      .setDescription("⏭️ Skip"),

    new SlashCommandBuilder()
      .setName("stop")
      .setDescription("🛑 Stop"),

    new SlashCommandBuilder()
      .setName("queue")
      .setDescription("📜 Queue"),

    // ---------------- ECONOMY ----------------
    new SlashCommandBuilder()
      .setName("balance")
      .setDescription("💰 Balance"),

    new SlashCommandBuilder()
      .setName("daily")
      .setDescription("🎁 Daily"),

    new SlashCommandBuilder()
      .setName("beg")
      .setDescription("🥺 Beg"),

    new SlashCommandBuilder()
      .setName("work")
      .setDescription("💼 Work"),

    new SlashCommandBuilder()
      .setName("slots")
      .setDescription("🎰 Slots")
      .addIntegerOption(o =>
        o.setName("bet")
          .setDescription("Bet")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("transfer")
      .setDescription("💸 Transfer")
      .addUserOption(o =>
        o.setName("user")
          .setDescription("Target")
          .setRequired(true)
      )
      .addIntegerOption(o =>
        o.setName("amount")
          .setDescription("Amount")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("steal")
      .setDescription("🕵️ Steal money")
      .addUserOption(o =>
        o.setName("user")
          .setDescription("Target")
          .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("🏆 Top richest users"),

    // ---------------- BLACKJACK ----------------
    new SlashCommandBuilder()
      .setName("blackjack")
      .setDescription("🃏 Blackjack")
      .addIntegerOption(o =>
        o.setName("bet")
          .setDescription("Bet")
          .setRequired(true)
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

  stayInVC();
});

// ---------------- INTERACTIONS ----------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  const u = await getUser(interaction.user.id);

  // ---------------- PRODHAN ----------------
  if (interaction.commandName === "prodhan") {
    const images = fs.existsSync(imageFolder)
      ? fs.readdirSync(imageFolder).filter(f =>
          /\.(png|jpg|jpeg|webp)$/i.test(f)
        )
      : [];

    if (!images.length)
      return interaction.reply("❌ No images found");

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

  if (!vc)
    return interaction.reply("❌ Join VC first");

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

    // FORCE CONNECT
    if (!player.voiceId) {
      await player.connect();
    }

    const res = await kazagumo.search(query, {
      requester: interaction.user,
    });

    if (!res || !res.tracks.length) {
      return interaction.followUp("❌ No songs found");
    }

    const track = res.tracks[0];

    player.queue.add(track);

    if (!player.playing && !player.paused) {
      await player.play();
    }

    return interaction.followUp(
      `🎵 Now playing **${track.title}**`
    );
  } catch (err) {
    console.log("PLAY ERROR:", err);

    return interaction.followUp(
      "❌ Lavalink connection failed"
    );
  }
}

  // ---------------- SKIP ----------------
  if (interaction.commandName === "skip") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player)
      return interaction.reply("❌ No music playing");

    try {
      await player.skip();

      return interaction.reply("⏭️ Skipped");
    } catch (err) {
      console.log(err);

      return interaction.reply("❌ Skip failed");
    }
  }

  // ---------------- STOP ----------------
  if (interaction.commandName === "stop") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player)
      return interaction.reply("❌ No music playing");

    try {
      player.queue.clear();

      await player.skip().catch(() => {});

      return interaction.reply(
        "🛑 Stopped music (stayed in VC)"
      );
    } catch (err) {
      console.log(err);

      return interaction.reply("❌ Stop failed");
    }
  }

  // ---------------- QUEUE ----------------
  if (interaction.commandName === "queue") {
    const player = kazagumo.players.get(interaction.guild.id);

    if (!player)
      return interaction.reply("❌ No music");

    const current = player.queue.current;
    const q = player.queue;

    let msg = current
      ? `🎵 Now: **${current.title}**\n\n`
      : "";

    if (!q.size)
      return interaction.reply(msg + "📭 Empty");

    msg += q
      .slice(0, 10)
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join("\n");

    return interaction.reply(msg);
  }

  // ---------------- BALANCE ----------------
  if (interaction.commandName === "balance") {
    return interaction.reply(
      `💰 You have ${u.wallet} coins`
    );
  }

  // ---------------- DAILY ----------------
  if (interaction.commandName === "daily") {
    const now = Date.now();

    if (now - u.lastDaily < cooldowns.daily) {
      const left = Math.ceil(
        (cooldowns.daily - (now - u.lastDaily)) / 3600000
      );

      return interaction.reply(
        `⏳ Come back in ${left} hour(s)`
      );
    }

    u.wallet += 1000;
    u.lastDaily = now;

    await saveUser(interaction.user.id, u);

    return interaction.reply("🎁 You received 1000 coins");
  }

  // ---------------- BEG ----------------
  if (interaction.commandName === "beg") {
    const now = Date.now();

    if (now - u.lastBeg < cooldowns.beg) {
      const left = Math.ceil(
        (cooldowns.beg - (now - u.lastBeg)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const amount = Math.floor(Math.random() * 200);

    u.wallet += amount;
    u.lastBeg = now;

    await saveUser(interaction.user.id, u);

    return interaction.reply(
      `🥺 Someone gave you ${amount} coins`
    );
  }

  // ---------------- WORK ----------------
  if (interaction.commandName === "work") {
    const now = Date.now();

    if (now - u.lastWork < cooldowns.work) {
      const left = Math.ceil(
        (cooldowns.work - (now - u.lastWork)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const amount = Math.floor(Math.random() * 500) + 300;

    u.wallet += amount;
    u.lastWork = now;

    await saveUser(interaction.user.id, u);

    return interaction.reply(
      `💼 You earned ${amount} coins`
    );
  }

  // ---------------- SLOTS ----------------
  if (interaction.commandName === "slots") {
    const bet = interaction.options.getInteger("bet");

    if (bet <= 0)
      return interaction.reply("❌ Invalid bet");

    if (u.wallet < bet)
      return interaction.reply("❌ Not enough money");

    const symbols = ["🍒", "🍋", "🍇", "💎", "7️⃣"];

    const roll = () =>
      symbols[Math.floor(Math.random() * symbols.length)];

    const r1 = roll();
    const r2 = roll();
    const r3 = roll();

    let multi = 0;

    if (r1 === r2 && r2 === r3) multi = 5;
    else if (
      r1 === r2 ||
      r2 === r3 ||
      r1 === r3
    ) multi = 2;

    if (multi > 0) {
      const win = bet * multi;

      u.wallet += win;

      await saveUser(interaction.user.id, u);

      return interaction.reply(
        `🎰 | ${r1} | ${r2} | ${r3} |\n🎉 You won ${win} coins`
      );
    } else {
      u.wallet -= bet;

      await saveUser(interaction.user.id, u);

      return interaction.reply(
        `🎰 | ${r1} | ${r2} | ${r3} |\n💀 You lost ${bet} coins`
      );
    }
  }

  // ---------------- TRANSFER ----------------
  if (interaction.commandName === "transfer") {
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0)
      return interaction.reply("❌ Invalid amount");

    if (u.wallet < amount)
      return interaction.reply("❌ Not enough money");

    const target = await getUser(targetUser.id);

    u.wallet -= amount;
    target.wallet += amount;

    await saveUser(interaction.user.id, u);
    await saveUser(targetUser.id, target);

    return interaction.reply(
      `💸 Sent ${amount} coins to <@${targetUser.id}>`
    );
  }

  // ---------------- STEAL ----------------
  if (interaction.commandName === "steal") {
    const now = Date.now();

    const targetUser = interaction.options.getUser("user");

    if (targetUser.id === interaction.user.id)
      return interaction.reply("❌ You can't steal from yourself");

    if (u.lastSteal && now - u.lastSteal < cooldowns.steal) {
      const left = Math.ceil(
        (cooldowns.steal - (now - u.lastSteal)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const target = await getUser(targetUser.id);

    if (target.wallet <= 0)
      return interaction.reply("❌ Target has no money");

    const stolen = Math.floor(Math.random() * target.wallet);

    target.wallet -= stolen;
    u.wallet += stolen;

    u.lastSteal = now;

    await saveUser(interaction.user.id, u);
    await saveUser(targetUser.id, target);

    return interaction.reply(
      `🕵️ You stole ${stolen} coins from <@${targetUser.id}>`
    );
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
      "🏆 Richest Users\n\n" +
        users
          .map(
            (user, i) =>
              `${i + 1}. <@${user.id}> — ${user.total} coins`
          )
          .join("\n")
    );
  }

  // ---------------- BLACKJACK ----------------
  if (interaction.commandName === "blackjack") {
    const bet = interaction.options.getInteger("bet");

    if (bet <= 0)
      return interaction.reply("❌ Invalid bet");

    if (u.wallet < bet)
      return interaction.reply("❌ Not enough money");

    const player = [draw(), draw()];
    const dealer = [draw(), draw()];

    blackjack.set(interaction.user.id, {
      bet,
      player,
      dealer,
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("HIT")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("STAND")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: `🃏 You: ${sum(player)} | Dealer: ${dealer[0]}`,
      components: [row],
    });
  }

  // ---------------- BLACKJACK BUTTONS ----------------
  if (interaction.isButton()) {
    const game = blackjack.get(interaction.user.id);

    if (!game)
      return interaction.reply({
        content: "❌ No blackjack game",
        ephemeral: true,
      });

    const p = game.player;
    const d = game.dealer;

    // ---------------- HIT ----------------
    if (interaction.customId === "hit") {
      p.push(draw());

      if (sum(p) > 21) {
        blackjack.delete(interaction.user.id);

        u.wallet -= game.bet;

        await saveUser(interaction.user.id, u);

        return interaction.update({
          content: `💥 Bust! You lost ${game.bet} coins`,
          components: [],
        });
      }

      return interaction.update({
        content: `🃏 You: ${sum(p)} | Dealer: ${d[0]}`,
        components: interaction.message.components,
      });
    }

    // ---------------- STAND -----------------
    if (interaction.customId === "stand") {
      while (sum(d) < 17) {
        d.push(draw());
      }

      const ps = sum(p);
      const ds = sum(d);

      blackjack.delete(interaction.user.id);

      let result = "";

      if (ds > 21 || ps > ds) {
        u.wallet += game.bet;
        result = `🎉 You won ${game.bet} coins`;
      } else if (ps < ds) {
        u.wallet -= game.bet;
        result = `💀 You lost ${game.bet} coins`;
      } else {
        result = "🤝 Tie";
      }

      await saveUser(interaction.user.id, u);

      return interaction.update({
        content: `🃏 You: ${ps} | Dealer: ${ds}\n${result}`,
        components: [],
      });
    }
  }
});

client.login(process.env.TOKEN);