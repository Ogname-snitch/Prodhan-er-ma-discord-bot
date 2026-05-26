const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 15000;

async function getUser(id) {
  return await User.getUser(id);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("🥺 Beg for coins"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastBeg < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastBeg)) / 1000);
      return interaction.reply(`⏳ Wait ${left} seconds`);
    }

    let amount = Math.floor(Math.random() * 200);

    // 🟣 PERK: BEGGAR (higher jackpot chance)
    if (user.perk === "Beggar") {
      if (Math.random() < 0.65) {
        amount = 3000;
      }
    }

    user.wallet += amount;
    user.lastBeg = now;

    await user.save();

    return interaction.reply(`🥺 Someone gave you ${amount} coins`);
  },
};