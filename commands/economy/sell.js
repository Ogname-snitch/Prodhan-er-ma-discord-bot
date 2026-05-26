const { SlashCommandBuilder } = require("discord.js");
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
    .setDescription("💰 Sell items or goods")
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
    // ⭐ GOODS SYSTEM (cake, fish, etc)
    // =========================
    if (user.goods && user.goods[item] !== undefined) {

      totalAmount = user.goods[item];

      if (totalAmount <= 0) {
        return interaction.reply(`❌ You don't have any ${item}`);
      }

      if (item === "cake") {
        totalValue = totalAmount * (Math.floor(Math.random() * 1991) + 10);
      }

      if (item === "fish") {
        totalValue = totalAmount * (Math.floor(Math.random() * 901) + 100);
      }

      if (item === "animal") {
        totalValue = totalAmount * (Math.floor(Math.random() * 9901) + 100);
      }

      if (item === "giftcard") {
        totalValue = totalAmount * 10;
      }

      user.wallet += totalValue;
      user.goods[item] = 0;

      user.markModified("goods");
      await user.save();

      return interaction.reply(
        `💰 Sold ALL ${item} (${totalAmount}x) for ${totalValue} coins`
      );
    }

    // =========================
    // ⭐ ARRAY INVENTORY SYSTEM
    // =========================
    const inv = user.inventory || [];
    const existing = inv.find(i => i.item === item);

    if (!existing || existing.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    totalAmount = existing.amount;
    const price = prices[item] || 0;

    totalValue = price * totalAmount;

    // remove item completely
    user.inventory = inv.filter(i => i.item !== item);

    user.wallet += totalValue;

    user.markModified("inventory");
    await user.save();

    return interaction.reply(
      `💰 Sold ALL ${item} (${totalAmount}x) for ${totalValue} coins`
    );
  },
};