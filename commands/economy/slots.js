const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Slot machine")
    .addIntegerOption(o =>
      o.setName("bet").setDescription("Bet").setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = await User.getUser(interaction.user.id);

    if (bet <= 0) return interaction.reply("❌ Invalid bet");
    if (bet > 10000) {
  return interaction.reply("❌ Maximum bet is 10,000 coins");
}
    if (user.wallet < bet) return interaction.reply("❌ Not enough money");

    const roll = () => {
      const r = Math.random();
      if (r < 0.05) return "7️⃣";
      if (r < 0.15) return "💎";
      if (r < 0.35) return "🍇";
      if (r < 0.65) return "🍋";
      return "🍒";
    };

    const r1 = roll();
    const r2 = roll();
    const r3 = roll();

    let winChance = 0.30; // 30% win rate

const isWin = Math.random() < winChance;

let multi = 0;
let win = 0;

if (isWin) {
  const r1 = roll();
  const r2 = Math.random() < 0.5 ? r1 : roll();
  const r3 = Math.random() < 0.5 ? r1 : roll();

  if (r1 === r2 && r2 === r3) multi = 4;
  else multi = 1;

  win = bet * multi;

  // ⭐ PERK SYSTEM (Alcoholic stays working)
  if (user.perk === "Alcoholic") {
    const lvl = user.perkLevel || 1;
    const slotBoost = 0.30 + (lvl - 1) * 0.05;

    if (Math.random() < slotBoost && multi > 0) {
      win = Math.floor(win * 1.5);
    }
  }

  user.wallet += win;
} else {
  user.wallet -= bet;
}

    await user.save();

    return interaction.reply(
      `🎰 | ${r1} | ${r2} | ${r3} |\n${multi ? `🎉 Won ${win}` : `💀 Lost ${bet}`}`
    );
  },
};