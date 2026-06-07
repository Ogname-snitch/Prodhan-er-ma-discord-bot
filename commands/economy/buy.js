const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

// 🛒 SHOP PRICES
const items = {
  "baking equipment": 5000,
  "gun": 10000,
  "rifle": 25000,
  "fishing rod": 5000,
  "streaming equipment": 20000,
  "games": 10000,
  "ski masks": 100,
};

const itemIcons = {
  "baking equipment": "🎂",
  "gun": "🔫",
  "rifle": "🎯",
  "fishing rod": "🎣",
  "streaming equipment": "📹",
  "games": "🎮",
  "ski masks": "🎭",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("🛒 Buy an item")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Choose an item")
        .setRequired(true)
        .addChoices(
          { name: "Baking Equipment", value: "baking equipment" },
          { name: "Gun", value: "gun" },
          { name: "Rifle", value: "rifle" },
          { name: "Fishing Rod", value: "fishing rod" },
          { name: "Streaming Equipment", value: "streaming equipment" },
          { name: "Games", value: "games" },
          { name: "Ski Masks", value: "ski masks" }
        )
    ),

  async execute(interaction) {
    const item = interaction.options.getString("item");
    const price = items[item];

    const user = await User.getUser(interaction.user.id);

    if (!price) {
      return interaction.reply({
        content: "❌ Invalid item selected",
        ephemeral: true,
      });
    }

    if (user.wallet < price) {
      return interaction.reply({
        content: `❌ You need **${price.toLocaleString()} coins** to buy this item`,
        ephemeral: true,
      });
    }

    // 💸 deduct money
    user.wallet -= price;

    // 🎒 inventory system
    const inv = user.inventory || [];
    const existing = inv.find(i => i.item === item);

    if (existing) {
      existing.amount += 1;
    } else {
      inv.push({
        item,
        amount: 1,
      });
    }

    user.inventory = inv;
    user.markModified("inventory");

    await user.save();

    // ================= UI EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🛒 PURCHASE COMPLETE")
      .setDescription(
        [
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          `✨ **Item Bought:** ${itemIcons[item]} **${item.toUpperCase()}**`,
          "",
          `💰 **Cost:** \`${price.toLocaleString()} coins\``,
          `🏦 **Remaining Balance:** \`${user.wallet.toLocaleString()} coins\``,
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          "📦 Item has been added to your inventory.",
        ].join("\n")
      )
      .setFooter({ text: "🛍️ Economy Shop System" });

    return interaction.reply({
      embeds: [embed],
    });
  },
};