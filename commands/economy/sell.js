const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

// 💰 SELL VALUES
const prices = {
  "baking equipment": 2500,
  "gun": 5000,
  "rifle": 12500,
  "streaming equipment": 10000,
  "games": 5000,
  "ski masks": 50,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell an item")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Item to sell")
        .setRequired(true)
        .addChoices(
          { name: "Baking Equipment", value: "baking equipment" },
          { name: "Gun", value: "gun" },
          { name: "Rifle", value: "rifle" },
          { name: "Streaming Equipment", value: "streaming equipment" },
          { name: "Games", value: "games" },
          { name: "Ski Masks", value: "ski masks" }
        )
    ),

  async execute(interaction) {

    const item =
      interaction.options.getString("item");

    const user =
      await User.getUser(interaction.user.id);

    if (
      !user.inventory ||
      !user.inventory[item] ||
      user.inventory[item] <= 0
    ) {
      return interaction.reply(
        "❌ You don't own this item"
      );
    }

    const value = prices[item] || 0;

    user.inventory[item] -= 1;

    if (user.inventory[item] <= 0) {
      delete user.inventory[item];
    }

    user.wallet += value;

    user.markModified("inventory");

    await user.save();

    return interaction.reply(
      `💰 You sold **${item}** for ${value} coins`
    );
  },
};