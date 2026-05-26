const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items")

    // 🔥 DROPDOWN (FIXED)
    .addStringOption(option =>
      option.setName("item")
        .setDescription("Choose item to sell")
        .setRequired(true)
        .addChoices(
          { name: "Cake", value: "cake" },
          { name: "Fish", value: "fish" },
          { name: "Animal", value: "animal" },
          { name: "Giftcard", value: "giftcard" },
          { name: "Baking Equipment", value: "baking equipment" },
          { name: "Gun", value: "gun" },
          { name: "Rifle", value: "rifle" },
          { name: "Streaming Equipment", value: "streaming equipment" },
          { name: "Games", value: "games" },
          { name: "Ski Masks", value: "ski masks" }
        )
    ),

  async execute(interaction) {

    let item = interaction.options.getString("item");
    item = item.trim().toLowerCase(); // 🔥 FIX 1: normalize input

    const user = await User.getUser(interaction.user.id);

    let total = 0;

    // ================= GOODS SYSTEM =================
    if (user.goods && user.goods[item] && user.goods[item] > 0) {

      const amount = user.goods[item];

      const priceMap = {
        cake: 10,
        fish: 100,
        animal: 100,
        giftcard: 10,
      };

      const unitPrice = priceMap[item];

      if (!unitPrice) {
        return interaction.reply("❌ This item cannot be sold as goods");
      }

      total = amount * unitPrice;

      user.wallet += total;
      user.goods[item] = 0;

      await user.save();

      return interaction.reply(
        `💰 Sold ALL ${item} (${amount}x) for ${total} coins`
      );
    }

    // ================= INVENTORY SYSTEM =================
    const inv = user.inventory || [];

    const found = inv.find(
      i => i.item.toLowerCase() === item
    );

    if (!found || found.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    const prices = {
      "baking equipment": 2500,
      gun: 5000,
      rifle: 12500,
      "streaming equipment": 10000,
      games: 5000,
      "ski masks": 50,
    };

    const unitPrice = prices[item];

    if (!unitPrice) {
      return interaction.reply("❌ This item has no sell value");
    }

    total = found.amount * unitPrice;

    user.wallet += total;

    user.inventory = inv.filter(
      i => i.item.toLowerCase() !== item
    );

    await user.save();

    return interaction.reply(
      `💰 Sold ALL ${item} (${found.amount}x) for ${total} coins`
    );
  },
};