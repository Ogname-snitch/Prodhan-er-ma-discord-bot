const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  getUser,
  saveUser,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("💸 Transfer money")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("Target user")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  async execute(interaction) {
    const sender = await getUser(
      interaction.user.id
    );

    const targetUser =
      interaction.options.getUser("user");

    const amount =
      interaction.options.getInteger(
        "amount"
      );

    if (amount <= 0) {
      return interaction.reply(
        "❌ Invalid amount"
      );
    }

    if (sender.wallet < amount) {
      return interaction.reply(
        "❌ Not enough money"
      );
    }

    const target = await getUser(
      targetUser.id
    );

    sender.wallet -= amount;
    target.wallet += amount;

    await saveUser(
      interaction.user.id,
      sender
    );

    await saveUser(
      targetUser.id,
      target
    );

    interaction.reply(
      `💸 Sent ${amount} coins to <@${targetUser.id}>`
    );
  },
};