const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("🎒 View inventory")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const target =
        interaction.options.getUser("user") || interaction.user;

      const user = await User.findOne({ userId: target.id });

      if (!user) {
        return interaction.reply({
          content: "🎒 No data found for this user",
          ephemeral: true,
        });
      }

      const inv = user.inventory || [];

      if (inv.length === 0) {
        return interaction.reply(
          `🎒 ${target.username} has no items`
        );
      }

      const text = inv
        .map(i => `• ${i.item} x${i.amount}`)
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`🎒 ${target.username}'s Inventory`)
        .setDescription(text)
        .setColor("Blue");

      return interaction.reply({
        embeds: [embed],
      });

    } catch (err) {
      console.log("INVENTORY ERROR:", err);

      return interaction.reply({
        content: "❌ Inventory failed",
        ephemeral: true,
      });
    }
  },
};