const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Slot machine")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Bet amount (max 10000)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = await User.getUser(interaction.user.id);

    // ❌ MAX BET LIMIT
    if (bet > 10000) {
      return interaction.reply("❌ Maximum bet is 10,000 coins");
    }

    if (bet <= 0) return interaction.reply("❌ Invalid bet");
    if (user.wallet < bet) return interaction.reply("❌ Not enough money");

    const symbols = ["🍒", "🍋", "🍇", "💎", "7️⃣"];

    // 🎯 LOWER WIN CHANCE
    const roll = () => {
      const rand = Math.random();

      // mostly random → fewer wins
      if (rand < 0.05) return "7️⃣";
      if (rand < 0.15) return "💎";
      if (rand < 0.35) return "🍇";
      if (rand < 0.65) return "🍋";
      return "🍒";
    };

    const r1 = roll();
    const r2 = roll();
    const r3 = roll();

    let multi = 0;

    // harder win conditions
    if (r1 === r2 && r2 === r3) multi = 4; // slightly reduced jackpot
    else if (r1 === r2 || r2 === r3 || r1 === r3) multi = 1; // weaker payout

    let win = bet * multi;

    if (user.perk === "Alcoholic" && multi > 0) {
      win = Math.floor(win * 1.25);
    }

    if (multi > 0) {
      user.wallet += win;
      await user.save();

      return interaction.reply(
        `🎰 | ${r1} | ${r2} | ${r3} |\n🎉 You won ${win} coins`
      );
    }

    user.wallet -= bet;
    await user.save();

    return interaction.reply(
      `🎰 | ${r1} | ${r2} | ${r3} |\n💀 You lost ${bet} coins`
    );
  },
};