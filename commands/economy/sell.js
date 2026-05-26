const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items")

    // 🔥 DROPDOWN FIX (THIS IS WHAT YOU WANTED)
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
    const item = interaction.options.getString("item");
    const user = await User.getUser(interaction.user.id);

    let total = 0;

    // ================= GOODS =================
    if (user.goods[item]) {
      const amount = user.goods[item];

      if (amount <= 0)
        return interaction.reply("❌ You don't have this item");

      const priceMap = {
        cake: 10,
        fish: 100,
        animal: 100,
        giftcard: 10,
      };

      total = amount * (priceMap[item] || 0);

      user.wallet += total;
      user.goods[item] = 0;

      await user.save();

      return interaction.reply(`💰 Sold ALL ${item} for ${total} coins`);
    }

    // ================= INVENTORY =================
    const inv = user.inventory || [];
    const found = inv.find(i => i.item === item);

    if (!found || found.amount <= 0)
      return interaction.reply("❌ You don't own this item");

    const prices = {
      "baking equipment": 2500,
      gun: 5000,
      rifle: 12500,
      "streaming equipment": 10000,
      games: 5000,
      "ski masks": 50,
    };

    total = found.amount * (prices[item] || 0);

    user.wallet += total;
    user.inventory = inv.filter(i => i.item !== item);

    await user.save();

    return interaction.reply(`💰 Sold ALL ${item} for ${total} coins`);
  },
};