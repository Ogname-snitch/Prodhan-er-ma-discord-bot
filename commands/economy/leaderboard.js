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

    // ================= CLEAN FORMAT =================
    const leaderboard = users.map((u, i) => {
      const rank = i + 1;
      const medal = medals[i] || "🏅";

      return [
        "━━━━━━━━━━━━━━━━━━━━━━",
        "",
        `${medal} **Rank #${rank}**`,
        `👤 <@${u.userId}>`,
        `💰 Balance: **${(u.wallet || 0).toLocaleString()} coins**`,
        ""
      ].join("\n");
    }).join("\n");

    const topUser = users[0];

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🏆 GLOBAL WEALTH LEADERBOARD")
      .setDescription(
        [
          "💰 **Top 10 Richest Players**",
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          leaderboard,
          "━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n")
      )
      .setThumbnail(
        interaction.client.user.displayAvatarURL()
      )
      .addFields(
        {
          name: "👑 Top Player",
          value: `<@${topUser.userId}>`,
          inline: true,
        },
        {
          name: "💰 Wealth",
          value: `**${(topUser.wallet || 0).toLocaleString()} coins**`,
          inline: true,
        }
      )
      .setFooter({ text: "Economy Leaderboard • Live Rankings" });

    return interaction.reply({
      embeds: [embed],
    });
  },
};