const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const User = require("../../utils/database");

// prices
const fishPrices = { /* keep yours unchanged */ };
const itemPrices = { /* keep yours unchanged */ };

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items from inventory"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);
    const inv = user.inventory || [];

    if (!inv.length) {
      return interaction.reply("❌ Your inventory is empty");
    }

    const buttons = inv.slice(0, 20).map(i =>
      new ButtonBuilder()
        .setCustomId(`sell_${i.item}`)
        .setLabel(`${i.item} (${i.amount})`)
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(
        new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
      );
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💰 Sell Menu")
          .setDescription("Click an item to sell it")
      ],
      components: rows,
    });
  },

  // IMPORTANT: BUTTON HANDLER
  sellHandler: async (interaction, User) => {

    const item = interaction.customId.replace("sell_", "");
    const user = await User.getUser(interaction.user.id);
    const inv = user.inventory || [];

    const found = inv.find(i => i.item === item);

    if (!found) {
      return interaction.reply({
        content: "❌ You don't own this item",
        ephemeral: true,
      });
    }

    const amount = found.amount;

    let price = fishPrices[item] || itemPrices[item];

    if (!price) {
      return interaction.reply({
        content: "❌ This item has no sell value",
        ephemeral: true,
      });
    }

    const total = amount * price;

    user.wallet += total;
    user.inventory = inv.filter(i => i.item !== item);

    await user.save();

    return interaction.reply({
      content: `💰 Sold **${item}** (${amount}x) for **${total} coins**`,
      ephemeral: true,
    });
  },
};