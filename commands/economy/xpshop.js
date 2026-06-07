const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("xpshop")
    .setDescription("🛒 Spend XP points"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("🛒 XP Shop")
      .setDescription(
`⭐ Your XP: **${user.xp || 0}**

🏦 Bank Token
• +5,000 Bank Space
• Cost: 20 XP

🔒 Security Upgrade
• +5% caught rate
• Max: 70%
• Cost: 30 XP

✨ Perk Upgrade
• Max 3 upgrades
• Cost: 50 XP`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("xp_banktoken")
        .setLabel("Bank Token")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("xp_security")
        .setLabel("Security Upgrade")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("xp_perk")
        .setLabel("Perk Upgrade")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },

  async xpShopHandler(interaction, User) {

    if (!interaction.customId.startsWith("xp_")) return false;

    const user = await User.getUser(interaction.user.id);

    // ================= BANK TOKEN =================

    if (interaction.customId === "xp_banktoken") {

      if ((user.xp || 0) < 20) {
        return interaction.reply({
          content: "❌ You need 20 XP",
          ephemeral: true,
        });
      }

      user.xp -= 20;
      user.bankSpace += 5000;

      await user.save();

      return interaction.reply({
        content: "🏦 Purchased Bank Token (+5,000 bank space)",
        ephemeral: true,
      });
    }

    // ================= SECURITY =================

    if (interaction.customId === "xp_security") {

      if ((user.xp || 0) < 30) {
        return interaction.reply({
          content: "❌ You need 30 XP",
          ephemeral: true,
        });
      }

      if ((user.securityLevel || 0) >= 14) {
        return interaction.reply({
          content: "❌ Security already maxed (70%)",
          ephemeral: true,
        });
      }

      user.xp -= 30;
      user.securityLevel += 1;

      await user.save();

      return interaction.reply({
        content: `🔒 Security upgraded to ${
          user.securityLevel * 5
        }%`,
        ephemeral: true,
      });
    }

    // ================= PERK =================

    if (interaction.customId === "xp_perk") {

      if ((user.xp || 0) < 50) {
        return interaction.reply({
          content: "❌ You need 50 XP",
          ephemeral: true,
        });
      }

      if ((user.perkUpgrades || 0) >= 3) {
        return interaction.reply({
          content: "❌ Perk upgrades already maxed",
          ephemeral: true,
        });
      }

      user.xp -= 50;
      user.perkUpgrades += 1;

      await user.save();

      return interaction.reply({
        content: `✨ Perk upgraded (${user.perkUpgrades}/3)`,
        ephemeral: true,
      });
    }
  },
};