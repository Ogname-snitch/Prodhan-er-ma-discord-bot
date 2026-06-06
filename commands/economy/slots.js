const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Slot machine")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Bet amount")
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = await User.getUser(interaction.user.id);

    if (bet <= 0) return interaction.reply("❌ Invalid bet");
    if (user.wallet < bet) return interaction.reply("❌ Not enough money");

    const symbols = ["🍒", "🍋", "🍇", "💎", "7️⃣"];
    const roll = () => symbols[Math.floor(Math.random() * symbols.length)];

    const r1 = roll();
    const r2 = roll();
    const r3 = roll();

    let multi = 0;

    if (r1 === r2 && r2 === r3) multi = 5;
    else if (r1 === r2 || r2 === r3 || r1 === r3) multi = 2;

    let win = bet * multi;

    // 🟡 Alcoholic perk (+25% winnings)
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