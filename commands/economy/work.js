const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 30000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("💼 Work"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastWork < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastWork)) / 1000);
      return interaction.reply(`⏳ Cooldown: ${left}s`);
    }

    // ================= BASE WORK AMOUNT =================
    let amount = Math.floor(Math.random() * 500) + 300;

    // ================= WORKAHOLIC PERK =================
    if (user.perk === "Workaholic") {

      const level = Math.min(user.perkLevel || 1, 4);

      // Level 1: 2.5x multiplier
      if (level >= 1) {
        amount = Math.floor(amount * 2.5);
      }

      // Level 2–4: +5% each upgrade (stacking)
      if (level >= 2) {
        const bonusMultiplier = 1 + ((level - 1) * 0.05);
        amount = Math.floor(amount * bonusMultiplier);
      }
    }

    // ================= GLOBAL LEVEL BOOSTS =================
    if (user.level >= 5 && user.level < 15) amount *= 1.2;
    if (user.level >= 15) amount *= 1.4;

    amount = Math.floor(amount);

    user.wallet += amount;
    user.lastWork = now;

    await user.save();

    return interaction.reply(`💼 You worked and earned **${amount.toLocaleString()} coins**`);
  },
};