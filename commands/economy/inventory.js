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

      // ================= EMPTY INVENTORY =================
      if (inv.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle(`🎒 ${target.username}'s Inventory`)
          .setDescription(
            [
              "━━━━━━━━━━━━━━━━━━━━━━",
              "",
              "📦 This inventory is empty",
              "",
              "💡 Go buy items or use commands to collect loot!",
              "",
              "━━━━━━━━━━━━━━━━━━━━━━",
            ].join("\n")
          );

        return interaction.reply({
          embeds: [emptyEmbed],
        });
      }

      // ================= FORMAT ITEMS =================
      const formatted = inv
        .map((i, index) => {
          const icon = "📦";

          return [
            `**#${index + 1} ${icon} ${i.item}**`,
            `└─ Quantity: \`${i.amount.toLocaleString()}\``,
            ""
          ].join("\n");
        })
        .join("\n");

      // ================= EMBED =================
      const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle(`🎒 ${target.username}'s Inventory`)
        .setDescription(
          [
            "━━━━━━━━━━━━━━━━━━━━━━",
            "",
            formatted,
            "━━━━━━━━━━━━━━━━━━━━━━",
            "",
            `📊 Total Items: \`${inv.length}\``,
          ].join("\n")
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: "Inventory System • RPG Items" });

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