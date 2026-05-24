const {
  SlashCommandBuilder,
} = require("discord.js");

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
      return interaction.reply(
        "❌ No users found"
      );
    }

    const text = users
      .map(
        (u, i) =>
          `${i + 1}. <@${u.userId}> — ${u.wallet} coins`
      )
      .join("\n");

    return interaction.reply(
      `🏆 Richest Users\n\n${text}`
    );
  },
};