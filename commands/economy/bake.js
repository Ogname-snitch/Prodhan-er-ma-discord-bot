const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bake")
    .setDescription("🎂 Bake a cake"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastBake < cooldown) {
      return interaction.reply(`⏳ Wait ${Math.ceil((cooldown - (now - user.lastBake)) / 1000)}s`);
    }

    const equipment = user.inventory.find(i => i.item === "baking equipment" && i.amount > 0);
    if (!equipment) return interaction.reply("❌ You need baking equipment");

    const value = Math.floor(Math.random() * 1991) + 10;

    const existing = user.inventory.find(i => i.item === "cake");

    if (existing) {
      existing.amount += 1;
    } else {
      user.inventory.push({ item: "cake", amount: 1 });
    }

    user.lastBake = now;
    await user.save();

    return interaction.reply(`🎂 You baked a cake worth ${value} coins`);
  },
};