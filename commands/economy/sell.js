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

  // goods
  "cake": 0,
  "fish": 0,
  "animal": 0,
  "giftcard": 10,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell an item or goods")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Choose item to sell")
        .setRequired(true)
        .addChoices(
          // inventory items
          { name: "Baking Equipment", value: "baking equipment" },
          { name: "Gun", value: "gun" },
          { name: "Rifle", value: "rifle" },
          { name: "Streaming Equipment", value: "streaming equipment" },
          { name: "Games", value: "games" },
          { name: "Ski Masks", value: "ski masks" },

          // goods
          { name: "Cake", value: "cake" },
          { name: "Fish", value: "fish" },
          { name: "Animal", value: "animal" },
          { name: "Giftcard", value: "giftcard" },
        )
    ),

  async execute(interaction) {

    const item = interaction.options.getString("item");

    const user = await User.getUser(interaction.user.id);

    if (!user.goods) user.goods = {};
    if (!user.inventory) user.inventory = [];

    // =========================
    // GOODS SYSTEM
    // =========================
    if (["cake", "fish", "animal", "giftcard"].includes(item)) {

      if (!user.goods[item] || user.goods[item] <= 0) {
        return interaction.reply(`❌ You don't have any ${item}s`);
      }

      let value = 0;

      if (item === "cake") value = Math.floor(Math.random() * 1991) + 10;
      if (item === "fish") value = Math.floor(Math.random() * 901) + 100;
      if (item === "animal") value = Math.floor(Math.random() * 9901) + 100;

      if (item === "giftcard") {
        value = user.goods[item] * 10;
        user.wallet += value;
        user.goods[item] = 0;

        user.markModified("goods");
        await user.save();

        return interaction.reply(`💰 Sold all giftcards for ${value} coins`);
      }

      user.goods[item] -= 1;
      user.wallet += value;

      user.markModified("goods");
      await user.save();

      return interaction.reply(`💰 Sold 1 ${item} for ${value} coins`);
    }

    // =========================
    // INVENTORY SYSTEM
    // =========================
    const inv = user.inventory;

    const existing = inv.find(i => i.item === item);

    if (!existing || existing.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    const value = prices[item] || 0;

    existing.amount -= 1;

    if (existing.amount <= 0) {
      user.inventory = inv.filter(i => i.item !== item);
    }

    user.wallet += value;

    user.markModified("inventory");
    await user.save();

    return interaction.reply(
      `💰 You sold **${item}** for ${value} coins`
    );
  },
};