const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("🏆 Richest users"),

  async execute(interaction) {

    const users = await User.find()
      .sort({ wallet: -1 })
      .limit(10);

    if (!users.length) {
      return interaction.reply({
        content: "❌ No users found",
        ephemeral: true,
      });
    }

    const medals = ["🥇", "🥈", "🥉"];

    const leaderboard = users.map((u, i) => {
      const rank = i + 1;
      const medal = medals[i] || "🏅";

      return [
        `${medal} **#${rank}**`,
        `<@${u.userId}>`,
        `💰 **${(u.wallet || 0).toLocaleString()}** coins`,
        "━━━━━━━━━━━━━━━━━━"
      ].join("\n");
    }).join("\n");

    const topUser = users[0];

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🏆 GLOBAL WEALTH LEADERBOARD")
      .setDescription(
        [
          "💰 *Top 10 richest players in the economy*",
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          leaderboard,
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n")
      )
      .setThumbnail(
        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
      )
      .setFooter({
        text: `👑 Top Player: ${topUser.userId} • ${topUser.wallet.toLocaleString()} coins`,
      });

    return interaction.reply({
      embeds: [embed],
    });
  },
};