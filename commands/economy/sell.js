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

    let sold = 0;
    let value = 0;

    // =========================
    // ⭐ GOODS SYSTEM (cake/fish/etc)
    // =========================
    if (user.goods && user.goods[item] !== undefined) {

      sold = user.goods[item];

      if (sold <= 0) {
        return interaction.reply(`❌ You don't have any ${item}`);
      }

      if (item === "cake") value = sold * (Math.floor(Math.random() * 1991) + 10);
      if (item === "fish") value = sold * (Math.floor(Math.random() * 901) + 100);
      if (item === "animal") value = sold * (Math.floor(Math.random() * 9901) + 100);
      if (item === "giftcard") value = sold * 10;

      user.wallet += value;
      user.goods[item] = 0;

      user.markModified("goods");
      await user.save();

      return interaction.reply(`💰 Sold ALL ${item} (${sold}x) for ${value} coins`);
    }

    // =========================
    // ⭐ ARRAY INVENTORY SYSTEM
    // =========================
    if (Array.isArray(user.inventory)) {

      const existing = user.inventory.find(i => i.item === item);

      if (!existing || existing.amount <= 0) {
        return interaction.reply("❌ You don't own this item");
      }

      sold = existing.amount;
      value = (prices[item] || 0) * sold;

      user.inventory = user.inventory.filter(i => i.item !== item);
      user.wallet += value;

      user.markModified("inventory");
      await user.save();

      return interaction.reply(`💰 Sold ALL ${item} (${sold}x) for ${value} coins`);
    }

    return interaction.reply("❌ Invalid inventory system");
  },
};