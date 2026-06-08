const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 300000;

// ================= STREAM QUOTES =================
const streamLines = [
  "You went live and 2 people showed up… both bots 🤖",
  "You accidentally leaked your screen and still got donations 💀",
  "A random viewer donated out of pity 😭",
  "You streamed for 5 hours and forgot to speak",
  "Chat spammed 'L streamer' but still watched 👀",
  "You got raided by a toxic 12-year-old clan",
  "You became famous for lagging in 144p 📉",
  "Someone clipped your worst moment and it went viral",
  "You carried a game and instantly called a hacker 🎮",
  "Your mic was muted the entire stream 💀",
  "Prodhan didn't like how the chuzz didnt like the stream",
  "Tuhid liked your minecraft gameplay",
  "Zarif wanted Marvel Rivals",
  "Suhaib's ISP barely let him watch",
  "Shayan hoped you'd show something related to basketball",
  "Yean wanted you to play a guitar",
  "Johan didn't like the game you played",
  "Omar wanted ULTRAKILL gameplay",
];

// ================= BASE STREAM AMOUNT =================
function getStreamAmount() {
  return Math.floor(Math.random() * (25000 - 500 + 1)) + 500;
}

// ================= STREAMER PERK SYSTEM =================
function applyStreamerPerk(amount, user) {
  if (user.perk !== "Streamer") return amount;

  const level = Math.min(user.perkLevel || 1, 4);

  // Level 1: +50% boost
  if (level >= 1) {
    amount *= 1.5;
  }

  // Level 2–4: +5% per extra level
  if (level >= 2) {
    const extraLevels = level - 1;
    amount *= 1 + (extraLevels * 0.05);
  }

  return amount;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stream")
    .setDescription("📹 Stream"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    // ================= COOLDOWN =================
    if (now - user.lastStream < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastStream)) / 1000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffcc70)
            .setTitle("📹 Chill out!")
            .setDescription(
              `You're streaming too often...\n\n⏳ Try again in **${left}s**`
            )
            .setFooter({ text: "Even streamers need breaks" }),
        ],
        ephemeral: true,
      });
    }

    // ================= REQUIREMENTS =================
    const setup = user.inventory.find(
      (i) => i.item === "streaming equipment"
    );
    const games = user.inventory.find((i) => i.item === "games");

    if (!setup || !games) {
      return interaction.reply(
        "❌ You need Streaming Equipment + Games to stream"
      );
    }

    // ================= BASE EARNINGS =================
    let amount = getStreamAmount();

    // ================= STREAMER PERK APPLY =================
    amount = applyStreamerPerk(amount, user);

    // ================= LEVEL BOOSTS =================
    if (user.level >= 5) amount *= 1.1;
    if (user.level >= 15) amount *= 1.3;

    amount = Math.floor(amount);

    user.wallet += amount;
    user.lastStream = now;

    await user.save();

    // ================= UI =================
    const line = streamLines[Math.floor(Math.random() * streamLines.length)];

    const embed = new EmbedBuilder()
      .setColor(amount >= 20000 ? 0x00ff99 : 0x2b2d31)
      .setTitle("📹 Stream Results")
      .setDescription(
        [
          `> *${line}*`,
          "",
          `💰 **You earned:** \`${amount.toLocaleString()} coins\``,
          "",
          amount >= 20000
            ? "🔥 **VIRAL STREAM!**"
            : "📉 Normal stream session...",
        ].join("\n")
      )
      .addFields(
        {
          name: "🎥 Streamer Perk",
          value: `${user.perk === "Streamer" ? `Level ${user.perkLevel}` : "None"}`,
          inline: true,
        },
        {
          name: "⏱ Cooldown",
          value: "5 minutes",
          inline: true,
        }
      )
      .setFooter({ text: "Streaming System • Content Creator Mode" });

    return interaction.reply({ embeds: [embed] });
  },
};