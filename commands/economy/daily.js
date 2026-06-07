const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 86400000; // 24h

async function getUser(id) {
  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({
      userId: id,
      wallet: 0,
      lastDaily: 0,
    });
  }

  return user;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎁 Claim your daily reward"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);
    const now = Date.now();

    // ================= COOLDOWN =================
    if (now - user.lastDaily < cooldown) {
      const left = cooldown - (now - user.lastDaily);

      const hours = Math.floor(left / 3600000);
      const minutes = Math.floor((left % 3600000) / 60000);

      const embed = new EmbedBuilder()
        .setColor(0xff4d4d)
        .setTitle("⏳ DAILY REWARD NOT READY")
        .setDescription(
          [
            "━━━━━━━━━━━━━━━━━━━━━━",
            "",
            "❌ You already claimed your daily reward.",
            "",
            `⏱️ **Time Remaining:** \`${hours}h ${minutes}m\``,
            "",
            "💡 Come back later to claim again!",
            "",
            "━━━━━━━━━━━━━━━━━━━━━━",
          ].join("\n")
        )
        .setFooter({ text: "Daily System • 24h cooldown" });

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    // ================= REWARD =================
    const reward = 1000;

    user.wallet += reward;
    user.lastDaily = now;

    await user.save();

    // ================= SUCCESS UI =================
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🎁 DAILY REWARD CLAIMED")
      .setDescription(
        [
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          "✨ You successfully claimed your daily reward!",
          "",
          `💰 **Reward:** \`${reward.toLocaleString()} coins\``,
          `🏦 **New Balance:** \`${(user.wallet || 0).toLocaleString()} coins\``,
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          "📅 Come back in 24 hours for another reward.",
        ].join("\n")
      )
      .setFooter({ text: "Daily Reward System" });

    return interaction.reply({
      embeds: [embed],
    });
  },
};