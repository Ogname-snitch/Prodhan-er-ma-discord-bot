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
    .setDescription("🛒 Level Points Shop"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor("#ffd700")
      .setTitle("🛒 LEVEL POINT SHOP")
      .setDescription(
`⭐ **Your Level Points:** ${user.points}

━━━━━━━━━━━━━━━

🏦 **Bank Expansion**
➕ +5,000 Bank Space
💰 Cost: 20 Points
📦 Current Space: ${user.bankSpace}

🔒 **Security Upgrade**
➕ +5% Catch Protection
📊 Current: ${user.securityLevel * 5}% / 70%
💰 Cost: 30 Points

✨ **Perk Upgrade**
🔧 Unlock stronger perks
📊 ${user.perkUpgrades}/3 upgrades
💰 Cost: 50 Points

━━━━━━━━━━━━━━━`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("xp_bank")
        .setLabel("🏦 Bank +5000")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("xp_security")
        .setLabel("🔒 Security +5%")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("xp_perk")
        .setLabel("✨ Perk Upgrade")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },

  async xpShopHandler(interaction, User) {
    if (!interaction.isButton()) return false;

    const user = await User.getUser(interaction.user.id);

    // ================= BANK =================
    if (interaction.customId === "xp_bank") {
      if (user.points < 20) {
        return interaction.reply({ content: "❌ Need 20 Points", ephemeral: true });
      }

      user.points -= 20;
      user.bankSpace += 5000;

      await user.save();

      return interaction.reply({
        content: "🏦 Bank space increased by +5000!",
        ephemeral: true,
      });
    }

    // ================= SECURITY =================
    if (interaction.customId === "xp_security") {
      if (user.points < 30) {
        return interaction.reply({ content: "❌ Need 30 Points", ephemeral: true });
      }

      if (user.securityLevel >= 14) {
        return interaction.reply({ content: "❌ Security already maxed (70%)", ephemeral: true });
      }

      user.points -= 30;
      user.securityLevel += 1;

      await user.save();

      return interaction.reply({
        content: `🔒 Security increased to ${user.securityLevel * 5}%`,
        ephemeral: true,
      });
    }

    // ================= PERK =================
    if (interaction.customId === "xp_perk") {
      if (user.points < 50) {
        return interaction.reply({ content: "❌ Need 50 Points", ephemeral: true });
      }

      if (user.perkUpgrades >= 3) {
        return interaction.reply({ content: "❌ Perk maxed (3/3)", ephemeral: true });
      }

      user.points -= 50;
      user.perkUpgrades += 1;

      await user.save();

      return interaction.reply({
        content: `✨ Perk upgraded (${user.perkUpgrades}/3)`,
        ephemeral: true,
      });
    }

    return false;
  },
};