const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("🎣 Catch fish"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);

    const now = Date.now();
    if (now - user.lastFish < 20000) {
      return interaction.reply("⏳ Wait 20s");
    }

    const value = Math.floor(Math.random() * 901) + 100;

    const g = user.goods || {};
    g.fish = (g.fish || 0) + 1;

    user.goods = g;
    user.lastFish = now;

    await user.save();

    return interaction.reply(`🐟 You caught fish worth ${value}`);
  },
};