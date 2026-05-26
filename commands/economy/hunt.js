const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("🔫 Hunt animals"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);

    const now = Date.now();
    if (now - user.lastHunt < 20000) {
      return interaction.reply("⏳ Wait 20s");
    }

    const value = Math.floor(Math.random() * 9901) + 100;

    const g = user.goods || {};
    g.animal = (g.animal || 0) + 1;

    user.goods = g;
    user.lastHunt = now;

    await user.save();

    return interaction.reply(`🦌 You hunted an animal worth ${value}`);
  },
};