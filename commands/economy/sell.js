const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items")
    .addStringOption(option =>
      option.setName("item")
        .setDescription("Choose item")
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

    const inv = user.inventory || [];
    const found = inv.find(i => i.item === item);

    if (!found || found.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    const prices = {
      cake: 500,
      fish: 200,
      animal: 800,
      giftcard: 10,
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

    const amount = found.amount;
    const total = amount * price;

    user.wallet += total;
    user.inventory = inv.filter(i => i.item !== item);

    await user.save();

    return interaction.reply(`💰 Sold ALL ${item} (${amount}x) for ${total} coins`);
  },
};