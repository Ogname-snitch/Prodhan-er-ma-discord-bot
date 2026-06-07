const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 15000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("🥺 Beg"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastBeg < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastBeg)) / 1000);
      return interaction.reply(`⏳ Cooldown: ${left}s`);
    }

    // ================= BASE AMOUNT =================
    let amount = Math.floor(Math.random() * 200) + 1;

    // ================= BEGGAR PERK =================
    if (user.perk === "Beggar") {

      const level = Math.min(user.perkLevel || 1, 4);

      // Level 1 base effect
      if (level >= 1) {
        if (Math.random() < 0.3) {
          amount = 3000;
        }
      }

      // Level 2+ upgrades (stacking +10% each level)
      if (level >= 2) {
        const bonusMultiplier = 1 + ((level - 1) * 0.1); 
        amount = Math.floor(amount * bonusMultiplier);
      }
    }

    // ================= GLOBAL LEVEL BUFFS =================
    if (user.level >= 5) amount *= 1.2;
    if (user.level >= 15) amount *= 1.4;

    amount = Math.floor(amount);

    user.wallet += amount;
    user.lastBeg = now;

    await user.save();

    return interaction.reply(`🥺 You begged and got **${amount.toLocaleString()} coins**`);
  },
};