const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items")
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

    const item = interaction.options.getString("item").toLowerCase();
    const user = await User.getUser(interaction.user.id);

    let total = 0;

    // ===================== GOODS SYSTEM =====================
    const goodsPrices = {
      cake: [10, 2000],
      fish: [100, 1000],
      animal: [100, 10000],
      giftcard: [10, 10],
    };

    if (user.goods && user.goods[item] && user.goods[item] > 0) {

      const amount = user.goods[item];

      const range = goodsPrices[item];

      if (!range) {
        return interaction.reply("❌ This item cannot be sold as goods");
      }

      let min = range[0];
      let max = range[1];

      // average price system
      const avg = Math.floor((min + max) / 2);

      total = amount * avg;

      user.wallet += total;
      user.goods[item] = 0;

      await user.save();

      return interaction.reply(
        `💰 Sold ALL ${item} (${amount}x) for ${total} coins`
      );
    }

    // ===================== INVENTORY SYSTEM =====================
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