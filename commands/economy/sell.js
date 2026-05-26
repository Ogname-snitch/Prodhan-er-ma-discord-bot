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
          { name: "Fish", value: "fish" },
          { name: "Cake", value: "cake" },
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

    const inv = user.inventory || [];

    const found = inv.find(i => i.item === item);

    if (!found || found.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    let total = 0;
    const amount = found.amount;

    // ================= RANDOM VALUE SYSTEM =================

    if (item === "fish") {
      for (let i = 0; i < amount; i++) {
        total += Math.floor(Math.random() * 501) + 100; // 100–600
      }
    }

    else if (item === "cake") {
      for (let i = 0; i < amount; i++) {
        total += Math.floor(Math.random() * 2001) + 1000; // 1000–3000
      }
    }

    else if (item === "animal") {
      for (let i = 0; i < amount; i++) {
        total += Math.floor(Math.random() * 5001) + 2000; // 2000–7000
      }
    }

    else if (item === "giftcard") {
      for (let i = 0; i < amount; i++) {
        total += Math.floor(Math.random() * 991) + 10; // 10–1000
      }
    }

    // ================= NORMAL ITEMS =================

    else {
      const prices = {
        "baking equipment": 2500,
        gun: 5000,
        rifle: 12500,
        "streaming equipment": 10000,
        games: 5000,
        "ski masks": 50,
      };

      const price = prices[item];

      if (!price) {
        return interaction.reply("❌ This item has no sell value");
      }

      total = amount * price;
    }

    // remove item
    user.inventory = inv.filter(i => i.item !== item);

    user.wallet += total;

    await user.save();

    return interaction.reply(
      `💰 Sold ALL ${item} (${amount}x) for ${total} coins`
    );
  },
};