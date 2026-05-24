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
    .setName("beg")
    .setDescription("🥺 Beg for money"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (
      now - user.lastBeg <
      cooldowns.beg
    ) {
      const left = Math.ceil(
        (cooldowns.beg -
          (now - user.lastBeg)) /
          1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const amount =
      Math.floor(Math.random() * 200);

    user.wallet += amount;
    user.lastBeg = now;

    await saveUser(interaction.user.id, user);

    interaction.reply(
      `🥺 Someone gave you ${amount} coins`
    );
  },
};