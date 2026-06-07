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
      return interaction.reply(`⏳ Cooldown`);
    }

    let amount = Math.floor(Math.random() * 500) + 300;

    if (user.perk === "Workaholic") {
      amount = Math.floor(amount * 2.5);
    }

    // ⭐ LEVEL BOOST (lvl 5+ & 15+)
    if (user.level >= 5 && user.level < 15) amount *= 1.2;
    if (user.level >= 15) amount *= 1.4;

    user.wallet += Math.floor(amount);
    user.lastWork = now;

    await user.save();

    return interaction.reply(`💼 +${Math.floor(amount)} coins`);
  },
};