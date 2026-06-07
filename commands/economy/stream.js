const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 300000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stream")
    .setDescription("📹 Stream"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastStream < cooldown) {
      return interaction.reply(`⏳ Cooldown`);
    }

    const setup = user.inventory.find(i => i.item === "streaming equipment");
    const games = user.inventory.find(i => i.item === "games");

    if (!setup || !games) {
      return interaction.reply("❌ Missing items");
    }

    let amount = Math.floor(Math.random() * 9991) + 10;

    if (user.perk === "Workaholic") amount *= 1.2;

    if (user.level >= 5) amount *= 1.2;
    if (user.level >= 15) amount *= 1.4;

    user.wallet += Math.floor(amount);
    user.lastStream = now;

    await user.save();

    return interaction.reply(`📹 +${Math.floor(amount)} coins`);
  },
};