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
  "Prodhan came and pulled out pocket change from his pocket and spat on you",
  "Tuhid pulled out some of the rewards he won on Jartex and gave you some of it",
  "Suhaib came and gave you some of the money he pays for his isp",
  "Yean came and gave you some of the money he got from buying a guitar on discount",
  "Zarif came and gave you some of the money he saved to repay Johan of his testicle",
  "Johan gave you some money so you pray for his platonic soulmate",
  "Mashrib gave some money because you remind him of himself",
  "Shayan gave you some money he won from basketball",
  "Omar gave you some money he earnt by being an underpaid programmer for Vent Studios",
];

// ================= RANDOM MONEY (UPDATED RANGE) =================
function getBegAmount() {
  return Math.floor(Math.random() * (1500 - 100 + 1)) + 100;
}

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
    let amount = getBegAmount();

    // ================= BEGGAR PERK =================
    if (user.perk === "Beggar") {
      const level = Math.min(user.perkLevel || 1, 4);

      if (level >= 1 && Math.random() < 0.25) {
        amount += 2000;
      }

      if (level >= 2) {
        const bonus = 1 + ((level - 1) * 0.15);
        amount = Math.floor(amount * bonus);
      }
    }

    // ================= GLOBAL LEVEL BUFFS =================
    if (user.level >= 5) amount *= 1.1;
    if (user.level >= 15) amount *= 1.25;

    amount = Math.floor(amount);

    // ⭐ HARD CAP KEPT
    if (amount > 2000) amount = 2000;

    user.wallet += amount;
    user.lastBeg = now;

    await user.save();

    // ================= UI =================
    const line = begLines[Math.floor(Math.random() * begLines.length)];

    const embed = new EmbedBuilder()
      .setColor(amount >= 4000 ? 0x00ff99 : 0x2b2d31)
      .setTitle("🥺 Beg Results")
      .setDescription(
        [
          `> *${line}*`,
          "",
          `💰 **You received:** \`${amount.toLocaleString()} coins\``,
          "",
          amount >= 4500
            ? "🔥 **HIGH PAYOUT!**"
            : "😐 Normal begging luck...",
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
      .setFooter({ text: "Beg System • Economyno" });

    return interaction.reply({ embeds: [embed] });
  },
};