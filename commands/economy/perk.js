const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const perks = ["Workaholic", "Alcoholic", "Robber", "Beggar"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perk")
    .setDescription("🎁 Get or reroll your perk (50k coins)"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);

    // if user already has perk → reroll cost
    if (user.perk) {
      if (user.wallet < 50000) {
        return interaction.reply("❌ You need 50,000 coins to reroll.");
      }

      user.wallet -= 50000;
    }

    const newPerk =
      perks[Math.floor(Math.random() * perks.length)];

    user.perk = newPerk;

    await user.save();

    return interaction.reply(`🎁 You got perk: **${newPerk}**`);
  },
};