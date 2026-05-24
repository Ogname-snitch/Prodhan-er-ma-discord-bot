const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 30000;

async function getUser(id) {
  let user = await User.getUser(id);
  return user;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("💼 Work for coins"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastWork < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastWork)) / 1000);
      return interaction.reply(`⏳ Wait ${left} seconds`);
    }

    let amount = Math.floor(Math.random() * 500) + 300;

    // 🟢 PERK: WORKAHOLIC (+30%)
    if (user.perk === "Workaholic") {
      amount = Math.floor(amount * 2);
    }

    user.wallet += amount;
    user.lastWork = now;

    await user.save();

    return interaction.reply(`💼 You earned ${amount} coins`);
  },
};