const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("🎒 View someone's inventory")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to check")
        .setRequired(false)
    ),

  async execute(interaction) {

    const target =
      interaction.options.getUser("user") ||
      interaction.user;

    const user =
      await User.getUser(target.id);

    const inventory =
      user.inventory || {};

    const items =
      Object.entries(inventory);

    if (!items.length) {
      return interaction.reply(
        `🎒 ${target.username} has no items`
      );
    }

    const text = items
      .map(([item, amount]) =>
        `• ${item} x${amount}`
      )
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle(`🎒 ${target.username}'s Inventory`)
      .setDescription(text)
      .setColor("Blue");

    return interaction.reply({
      embeds: [embed],
    });
  },
};