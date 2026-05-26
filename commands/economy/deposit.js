const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("🏦 Deposit money into bank")
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

    if (user.wallet < amount) {
      return interaction.reply(
        "❌ Not enough coins"
      );
    }

    if (user.bank + amount > user.bankSpace) {
      return interaction.reply(
        `❌ Bank full (${user.bank}/${user.bankSpace})`
      );
    }

    user.wallet -= amount;
    user.bank += amount;

    await user.save();

    return interaction.reply(
      `🏦 Deposited ${amount} coins`
    );
  },
};