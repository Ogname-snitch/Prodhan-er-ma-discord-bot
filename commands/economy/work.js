const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 30000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("💼 Work for coins"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastWork < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastWork)) / 1000);
      return interaction.reply(`⏳ Wait ${left}s`);
    }

    let amount = Math.floor(Math.random() * 500) + 300;

    // 🟢 Workaholic perk (x2.5)
    if (user.perk === "Workaholic") {
      amount = Math.floor(amount * 2.5);
    }

    user.wallet += amount;
    user.lastWork = now;

    await user.save();

    return interaction.reply(`💼 You earned ${amount} coins`);
  },
};