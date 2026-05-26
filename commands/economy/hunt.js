const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("🦌 Hunt animals"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastHunt < cooldown) {
      return interaction.reply(`⏳ Wait ${Math.ceil((cooldown - (now - user.lastHunt)) / 1000)}s`);
    }

    const weapon = user.inventory.find(i =>
      (i.item === "gun" || i.item === "rifle") && i.amount > 0
    );

    if (!weapon) return interaction.reply("❌ You need a gun or rifle");

    const value = Math.floor(Math.random() * 9901) + 100;

    const existing = user.inventory.find(i => i.item === "animal");

    if (existing) {
      existing.amount += 1;
    } else {
      user.inventory.push({ item: "animal", amount: 1 });
    }

    user.lastHunt = now;
    await user.save();

    return interaction.reply(`🦌 You hunted an animal worth ${value} coins`);
  },
};