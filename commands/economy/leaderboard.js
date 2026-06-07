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

    // ================= CLEAN CARD STYLE =================
    const leaderboard = users.map((u, i) => {
      const rank = i + 1;
      const medal = medals[i] || "🏅";

      const name = `<@${u.userId}>`;
      const balance = (u.wallet || 0).toLocaleString();

      return [
        `**${medal} Rank #${rank}**`,
        `👤 ${name}`,
        `💰 ${balance} coins`,
        "━━━━━━━━━━━━━━━━━━"
      ].join("\n");
    }).join("\n\n");

    const topUser = users[0];

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("🏆 GLOBAL WEALTH LEADERBOARD")
      .setDescription(
        [
          "💰 **Top 10 Richest Players in the Economy**",
          "",
          "```",
          "Rank  | Player              | Balance",
          "--------------------------------------",
          "```",
          "",
          leaderboard,
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
        ].join("\n")
      )
      .setThumbnail(
        interaction.client.user.displayAvatarURL()
      )
      .addFields(
        {
          name: "👑 King of Wealth",
          value: `<@${topUser.userId}>`,
          inline: true,
        },
        {
          name: "💰 Total Cash",
          value: `**${(topUser.wallet || 0).toLocaleString()} coins**`,
          inline: true,
        },
        {
          name: "🏆 Players Ranked",
          value: `**${users.length}**`,
          inline: true,
        }
      )
      .setFooter({
        text: "🏦 Economy System • Live Rankings",
      })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
    });
  },
};