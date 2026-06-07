const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 15000;

// ================= RANDOM FLAVOR LINES =================
const begLines = [
  "Someone dropped a coin... you picked it up",
  "A stranger felt bad for you 😭",
  "You begged aggressively... it worked",
  "A rich NPC gave you pity money",
  "You looked sad enough to get paid",
  "A Discord mod felt generous for once",
  "You held a sign: 'pls im broke' 💀",
  "Someone mistook you for a charity case",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("🥺 Beg for coins"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    // ================= COOLDOWN =================
    if (now - user.lastBeg < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastBeg)) / 1000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffcc70)
            .setTitle("🥺 Slow down!")
            .setDescription(`You are begging too fast...\n\n⏳ Try again in **${left}s**`)
            .setFooter({ text: "Even beggars need patience" })
        ],
        ephemeral: true,
      });
    }

    // ================= BASE AMOUNT =================
    let amount = Math.floor(Math.random() * 200) + 1;

    // ================= BEGGAR PERK =================
    if (user.perk === "Beggar") {
      const level = Math.min(user.perkLevel || 1, 4);

      if (level >= 1) {
        if (Math.random() < 0.3) {
          amount = 3000;
        }
      }

      if (level >= 2) {
        const bonusMultiplier = 1 + ((level - 1) * 0.1);
        amount = Math.floor(amount * bonusMultiplier);
      }
    }

    // ================= GLOBAL LEVEL BUFFS =================
    if (user.level >= 5) amount *= 1.2;
    if (user.level >= 15) amount *= 1.4;

    amount = Math.floor(amount);

    user.wallet += amount;
    user.lastBeg = now;

    await user.save();

    // ================= UI STYLE =================
    const line = begLines[Math.floor(Math.random() * begLines.length)];

    const embed = new EmbedBuilder()
      .setColor(amount > 1000 ? 0x00ff99 : 0x2b2d31)
      .setTitle("🥺 Beg Results")
      .setDescription(
        [
          `> *${line}*`,
          "",
          `💰 **You received:** \`${amount.toLocaleString()} coins\``,
          "",
          amount >= 3000
            ? "🔥 **LUCKY DROP!**"
            : "😐 Normal day of begging...",
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
          value: "15 seconds",
          inline: true,
        }
      )
      .setFooter({ text: "Beg System • Random Economy Event" });

    return interaction.reply({ embeds: [embed] });
  },
};