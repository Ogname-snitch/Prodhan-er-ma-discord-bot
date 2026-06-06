const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 15000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("🥺 Beg for coins"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastBeg < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastBeg)) / 1000);
      return interaction.reply(`⏳ Wait ${left}s`);
    }

    let amount = Math.floor(Math.random() * 200);

    // 🟣 Beggar perk (30% chance 3000)
    if (user.perk === "Beggar") {
      if (Math.random() < 0.30) {
        amount = 3000;
      }
    }

    user.wallet += amount;
    user.lastBeg = now;

    await user.save();

    return interaction.reply(`🥺 Someone gave you ${amount} coins`);
  },
};