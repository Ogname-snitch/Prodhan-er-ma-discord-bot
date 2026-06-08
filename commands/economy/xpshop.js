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

    // ensure safe defaults
    user.perkUpgrades = user.perkUpgrades || 0;
    user.perkLevel = user.perkLevel || 1;

    const nextCost = 50 + (user.perkUpgrades * 50);

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

✨ **Perk Upgrade**
🔧 Upgrade your current perk level
📊 Level: **${user.perkLevel}/4**
🔁 Upgrades: **${user.perkUpgrades}/4**
💰 Next Cost: **${nextCost} Points**

━━━━━━━━━━━━━━━`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("xp_bank")
        .setLabel("🏦 Bank +5000")
        .setStyle(ButtonStyle.Primary),

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

    user.perkUpgrades = user.perkUpgrades || 0;
    user.perkLevel = user.perkLevel || 1;

    // ================= BANK =================
    if (interaction.customId === "xp_bank") {
      if (user.points < 20) {
        return interaction.reply({
          content: "❌ Need 20 Points",
          ephemeral: true,
        });
      }

      user.points -= 20;
      user.bankSpace += 5000;

      await user.save();

      return interaction.reply({
        content: "🏦 Bank space increased by +5000!",
        ephemeral: true,
      });
    }

    // ================= PERK UPGRADE (FIXED SYSTEM) =================
    if (interaction.customId === "xp_perk") {

      // max upgrades reached
      if (user.perkUpgrades >= 4 || user.perkLevel >= 4) {
        return interaction.reply({
          content: "❌ Perk already fully upgraded (MAX LEVEL)",
          ephemeral: true,
        });
      }

      const cost = 50 + (user.perkUpgrades * 50);

      if (user.points < cost) {
        return interaction.reply({
          content: `❌ You need **${cost} points**`,
          ephemeral: true,
        });
      }

      user.points -= cost;
      user.perkUpgrades += 1;
      user.perkLevel += 1;

      if (user.perkLevel > 4) user.perkLevel = 4;

      await user.save();

      return interaction.reply({
        content: `✨ Perk upgraded to **Level ${user.perkLevel}/4**!\n💰 Cost: ${cost} points`,
        ephemeral: true,
      });
    }

    return false;
  },
};