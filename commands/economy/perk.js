const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

// ================= PERKS =================
// Added Fisher perk
const perks = [
  "Workaholic",
  "Alcoholic",
  "Robber",
  "Beggar",
  "Fisher", // ⭐ NEW PERK ADDED
];

async function getUser(id) {
  return await User.getUser(id);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perk")
    .setDescription("🎲 Get or reroll your perk (first time free, then 50k coins)"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const COST = 200000;

    // 🎁 FIRST TIME FREE
    if (!user.perkClaimed) {
      const random = perks[Math.floor(Math.random() * perks.length)];

      user.perk = random;
      user.perkClaimed = true;

      await user.save();

      return interaction.reply(
        `🎉 You got your first perk for FREE!\n✨ **${random}**`
      );
    }

    // 💰 CHECK BALANCE FOR REROLL
    if (user.wallet < COST) {
      return interaction.reply(
        `❌ You need ${COST.toLocaleString()} coins to reroll your perk`
      );
    }

    // 💸 TAKE MONEY
    user.wallet -= COST;

    const newPerk = perks[Math.floor(Math.random() * perks.length)];
    user.perk = newPerk;

    await user.save();

    return interaction.reply(
      `🎲 You rerolled your perk for 50,000 coins!\n✨ New perk: **${newPerk}**`
    );
  },
};