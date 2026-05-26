const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

// 💰 ITEM PRICES (shop items)
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
    .setDescription("💰 Sell all items of a type")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Item to sell")
        .setRequired(true)
    ),

  async execute(interaction) {

    const item = interaction.options.getString("item").toLowerCase();
    const user = await User.getUser(interaction.user.id);

    let totalValue = 0;
    let totalAmount = 0;

    // =========================
    // 🟢 GOODS SYSTEM (cake/fish/animal/giftcard)
    // =========================
    if (user.goods && user.goods[item] && user.goods[item] > 0) {

      totalAmount = user.goods[item];

      let baseValue = 0;

      if (item === "cake") baseValue = 10;
      if (item === "fish") baseValue = 100;
      if (item === "animal") baseValue = 100;
      if (item === "giftcard") baseValue = 10;

      totalValue = totalAmount * baseValue;

      user.wallet += totalValue;

      user.goods[item] = 0;
      user.markModified("goods");

      await user.save();

      return interaction.reply(
        `💰 Sold ALL ${item} (${totalAmount}x) for ${totalValue} coins`
      );
    }

    // =========================
    // 🟡 INVENTORY SYSTEM (shop items)
    // =========================
    const inv = user.inventory || [];
    const existing = inv.find(i => i.item === item);

    if (!existing || existing.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    totalAmount = existing.amount;
    const price = prices[item] || 0;

    totalValue = price * totalAmount;

    user.wallet += totalValue;

    // remove item completely
    user.inventory = inv.filter(i => i.item !== item);

    user.markModified("inventory");
    await user.save();

    return interaction.reply(
      `💰 Sold ALL ${item} (${totalAmount}x) for ${totalValue} coins`
    );
  },
};