const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bake")
    .setDescription("🍰 Bake a cake"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);

    const now = Date.now();
    if (now - user.lastBake < 20000) {
      return interaction.reply("⏳ Wait 20s");
    }

    const value = Math.floor(Math.random() * 1991) + 10;

    const g = user.goods || {};
    g.cake = (g.cake || 0) + 1;

    user.goods = g;
    user.lastBake = now;

    await user.save();

    return interaction.reply(`🍰 You baked a cake worth ${value} coins`);
  },
};