const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("🏦 Withdraw money from bank")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  async execute(interaction) {

    const amount =
      interaction.options.getInteger("amount");

    const user =
      await User.getUser(interaction.user.id);

    if (amount <= 0) {
      return interaction.reply(
        "❌ Invalid amount"
      );
    }

    if (user.bank < amount) {
      return interaction.reply(
        "❌ Not enough money in bank"
      );
    }

    user.bank -= amount;
    user.wallet += amount;

    await user.save();

    return interaction.reply(
      `🏦 Withdrew ${amount} coins`
    );
  },
};