const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("🐟 Go fishing"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastFish < cooldown) {
      return interaction.reply(`⏳ Wait ${Math.ceil((cooldown - (now - user.lastFish)) / 1000)}s`);
    }

    const rod = user.inventory.find(i => i.item === "fishing rod" && i.amount > 0);
    if (!rod) return interaction.reply("❌ You need a fishing rod");

    const value = Math.floor(Math.random() * 901) + 100;

    const existing = user.inventory.find(i => i.item === "fish");

    if (existing) {
      existing.amount += 1;
    } else {
      user.inventory.push({ item: "fish", amount: 1 });
    }

    user.lastFish = now;
    await user.save();

    return interaction.reply(`🐟 You caught a fish worth ${value} coins`);
  },
};