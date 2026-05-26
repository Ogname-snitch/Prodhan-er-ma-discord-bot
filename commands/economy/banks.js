const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("🏦 Buy more bank space")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Coins to spend")
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

    if (user.wallet < amount) {
      return interaction.reply(
        "❌ Not enough coins"
      );
    }

    const extraSpace =
      Math.floor(amount / 4);

    if (extraSpace <= 0) {
      return interaction.reply(
        "❌ Amount too low"
      );
    }

    user.wallet -= amount;
    user.bankSpace += extraSpace;

    await user.save();

    return interaction.reply(
      `🏦 You upgraded your bank by ${extraSpace} space`
    );
  },
};