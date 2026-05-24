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
    .setName("daily")
    .setDescription("🎁 Daily reward"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (
      now - user.lastDaily <
      cooldowns.daily
    ) {
      const left = Math.ceil(
        (cooldowns.daily -
          (now - user.lastDaily)) /
          3600000
      );

      return interaction.reply(
        `⏳ Come back in ${left} hour(s)`
      );
    }

    user.wallet += 1000;
    user.lastDaily = now;

    await saveUser(interaction.user.id, user);

    interaction.reply(
      "🎁 You received 1000 coins"
    );
  },
};