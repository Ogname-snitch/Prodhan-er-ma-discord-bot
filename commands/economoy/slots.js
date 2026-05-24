const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  getUser,
  saveUser,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Slots")
    .addIntegerOption(o =>
      o
        .setName("bet")
        .setDescription("Bet amount")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const bet =
      interaction.options.getInteger("bet");

    if (bet <= 0) {
      return interaction.reply(
        "❌ Invalid bet"
      );
    }

    if (user.wallet < bet) {
      return interaction.reply(
        "❌ Not enough money"
      );
    }

    const symbols = [
      "🍒",
      "🍋",
      "🍇",
      "💎",
      "7️⃣",
    ];

    const roll = () =>
      symbols[
        Math.floor(
          Math.random() * symbols.length
        )
      ];

    const r1 = roll();
    const r2 = roll();
    const r3 = roll();

    let multi = 0;

    if (r1 === r2 && r2 === r3)
      multi = 5;
    else if (
      r1 === r2 ||
      r2 === r3 ||
      r1 === r3
    )
      multi = 2;

    if (multi > 0) {
      const win = bet * multi;

      user.wallet += win;

      await saveUser(
        interaction.user.id,
        user
      );

      return interaction.reply(
        `🎰 | ${r1} | ${r2} | ${r3} |\n🎉 You won ${win} coins`
      );
    }

    user.wallet -= bet;

    await saveUser(
      interaction.user.id,
      user
    );

    interaction.reply(
      `🎰 | ${r1} | ${r2} | ${r3} |\n💀 You lost ${bet} coins`
    );
  },
};