const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

// 🛒 SHOP ITEMS
const items = {
  "baking equipment": 5000,
  "gun": 10000,
  "rifle": 25000,
  "streaming equipment": 20000,
  "games": 10000,
  "ski masks": 100,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("🛒 Buy an item")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Item to buy")
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

    const price = items[item];

    const user =
      await User.getUser(interaction.user.id);

    if (!price) {
      return interaction.reply(
        "❌ Invalid item"
      );
    }

    if (user.wallet < price) {
      return interaction.reply(
        `❌ You need ${price} coins`
      );
    }

    // 💸 remove money
    user.wallet -= price;

    // 🎒 inventory system
    if (!user.inventory) {
      user.inventory = {};
    }

    if (!user.inventory[item]) {
      user.inventory[item] = 0;
    }

    user.inventory[item] += 1;

    // IMPORTANT
    user.markModified("inventory");

    await user.save();

    return interaction.reply(
      `🛒 You bought **${item}** for ${price} coins`
    );
  },
};