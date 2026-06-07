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
      return interaction.reply(`⏳ Cooldown`);
    }

    let amount = Math.floor(Math.random() * 200);

    if (user.perk === "Beggar") {
      if (Math.random() < 0.3) amount = 3000;
    }

    if (user.level >= 5) amount *= 1.2;
    if (user.level >= 15) amount *= 1.4;

    user.wallet += Math.floor(amount);
    user.lastBeg = now;

    await user.save();

    return interaction.reply(`🥺 +${Math.floor(amount)} coins`);
  },
};