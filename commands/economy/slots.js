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

    let multi = 0;
    if (r1 === r2 && r2 === r3) multi = 4;
    else if (r1 === r2 || r2 === r3 || r1 === r3) multi = 1;

    let win = bet * multi;

    // ⭐ PERK SYSTEM (Alcoholic)
    if (user.perk === "Alcoholic") {
      const lvl = user.perkLevel || 1;

      const slotBoost = 0.30 + (lvl - 1) * 0.05; // 30% → 45%

      if (Math.random() < slotBoost && multi > 0) {
        win = Math.floor(win * 1.5);
      }
    }

    if (multi > 0) {
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