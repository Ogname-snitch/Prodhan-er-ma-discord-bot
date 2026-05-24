const {
  SlashCommandBuilder,
} = require("discord.js");

const cooldowns = require("../../utils/cooldowns");

const {
  getUser,
  saveUser,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("💼 Work for money"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (
      now - user.lastWork <
      cooldowns.work
    ) {
      const left = Math.ceil(
        (cooldowns.work -
          (now - user.lastWork)) /
          1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const amount =
      Math.floor(Math.random() * 500) +
      300;

    user.wallet += amount;
    user.lastWork = now;

    await saveUser(interaction.user.id, user);

    interaction.reply(
      `💼 You earned ${amount} coins`
    );
  },
};