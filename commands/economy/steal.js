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
    .setName("steal")
    .setDescription("🕵️ Steal money")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("Target")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = await getUser(
      interaction.user.id
    );

    const targetUser =
      interaction.options.getUser("user");

    if (
      targetUser.id === interaction.user.id
    ) {
      return interaction.reply(
        "❌ You can't steal from yourself"
      );
    }

    const now = Date.now();

    if (
      now - user.lastSteal <
      cooldowns.steal
    ) {
      const left = Math.ceil(
        (cooldowns.steal -
          (now - user.lastSteal)) /
          1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const target = await getUser(
      targetUser.id
    );

    if (target.wallet <= 0) {
      return interaction.reply(
        "❌ Target has no money"
      );
    }

    const stolen = Math.floor(
      Math.random() * target.wallet
    );

    target.wallet -= stolen;
    user.wallet += stolen;

    user.lastSteal = now;

    await saveUser(
      interaction.user.id,
      user
    );

    await saveUser(
      targetUser.id,
      target
    );

    interaction.reply(
      `🕵️ You stole ${stolen} coins from <@${targetUser.id}>`
    );
  },
};