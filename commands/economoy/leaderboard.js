const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  db,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription(
      "🏆 Richest users"
    ),

  async execute(interaction) {
    const all = await db.all();

    const users = all
      .filter(x =>
        x.id.startsWith("user_")
      )
      .map(x => ({
        id: x.id.replace(
          "user_",
          ""
        ),
        total:
          x.value.wallet || 0,
      }))
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, 10);

    interaction.reply(
      "🏆 Richest Users\n\n" +
        users
          .map(
            (u, i) =>
              `${i + 1}. <@${u.id}> — ${u.total} coins`
          )
          .join("\n")
    );
  },
};