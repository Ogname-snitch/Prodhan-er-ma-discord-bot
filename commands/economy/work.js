const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 30000;

// ================= FUNNY WORK QUOTES =================
const workLines = [
  "You worked as a Discord janitor and cleaned 3,000 messages 🧹",
  "You accidentally joined a pyramid scheme… but got paid 💀",
  "You sold overpriced bottled water in a desert 🏜️",
  "You coded for 12 hours and only fixed a comma 😭",
  "You worked at McDonald's and got yelled at by a chicken nugget 🍗",
  "You helped an old man turn it off and on again 💻",
  "You became a YouTube editor and added 1 transition in 5 hours 🎬",
  "You carried boxes labeled 'DO NOT DROP' and dropped them 💀",
  "You worked as a crypto advisor… everyone lost money 📉",
  "You were hired to breathe professionally 😤",
  "You tested chairs for 8 hours 🪑",
  "You worked in a scam call center and felt bad 😬",
  "You became a “motivational speaker” and confused everyone 🤡",
  "Prodhan paid you for distracting his mom from his bedtime",
  "Tuhid paid you for playing bedwars with him",
  "Suhaib paid you for threatening his ISP",
  "Zarif paid you for providing him “sources”",
  "Yean paid you for helping him learn guitar (You wer dead weight but he felt pity)",
  "Shayan paid you for playing basketball with him",
  "Johan paid you for rizz advice",
  "Omar paid you for helping him code the bot for a while",
];

// ================= RANDOM WORK AMOUNT =================
function getWorkAmount() {
  return Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("💼 Work"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    // ================= COOLDOWN =================
    if (now - user.lastWork < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastWork)) / 1000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffcc70)
            .setTitle("💼 Chill out!")
            .setDescription(`You're working too fast...\n\n⏳ Try again in **${left}s**`)
            .setFooter({ text: "Even employees need breaks" })
        ],
        ephemeral: true,
      });
    }

    // ================= BASE AMOUNT =================
    let amount = getWorkAmount();

    // ================= WORKAHOLIC PERK =================
    if (user.perk === "Workaholic") {
      const level = Math.min(user.perkLevel || 1, 4);

      // big multiplier early
      if (level >= 1) {
        amount = Math.floor(amount * 1.5);
      }

      // scaling bonus
      if (level >= 2) {
        const bonusMultiplier = 1 + ((level - 1) * 0.08);
        amount = Math.floor(amount * bonusMultiplier);
      }
    }

    // ================= GLOBAL LEVEL BOOSTS =================
    if (user.level >= 5) amount *= 1.1;
    if (user.level >= 15) amount *= 1.25;

    amount = Math.floor(amount);

    user.wallet += amount;
    user.lastWork = now;

    await user.save();

    // ================= UI =================
    const line = workLines[Math.floor(Math.random() * workLines.length)];

    const embed = new EmbedBuilder()
      .setColor(amount >= 15000 ? 0x00ff99 : 0x2b2d31)
      .setTitle("💼 Work Result")
      .setDescription(
        [
          `> *${line}*`,
          "",
          `💰 **You earned:** \`${amount.toLocaleString()} coins\``,
          "",
          amount >= 18000
            ? "🔥 **HIGH PAYING JOB!**"
            : "📉 Normal shift completed...",
        ].join("\n")
      )
      .addFields(
        {
          name: "📊 Perk",
          value: `${user.perk || "None"} (Lvl ${user.perkLevel || 1})`,
          inline: true,
        },
        {
          name: "⏱ Cooldown",
          value: "30 seconds",
          inline: true,
        }
      )
      .setFooter({ text: "Work System • Economy Job Simulator" });

    return interaction.reply({ embeds: [embed] });
  },
};