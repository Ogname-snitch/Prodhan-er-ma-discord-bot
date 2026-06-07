const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const User = require("../../utils/database");

const games = new Map();

function draw() {
  return Math.floor(Math.random() * 11) + 1;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("🃏 Blackjack")
    .addIntegerOption(o =>
      o.setName("bet").setDescription("Bet").setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = await User.getUser(interaction.user.id);

    if (user.wallet < bet)
      return interaction.reply("❌ Not enough money");

    let player = [draw(), draw()];
    const dealer = [draw(), draw()];

    // ⭐ PERK BONUS (instant 21 chance)
    if (user.perk === "Alcoholic") {
      const lvl = user.perkLevel || 1;
      const chance = 0.20 + (lvl - 1) * 0.05;

      if (Math.random() < chance) {
        player = [10, 11]; // instant strong hand
      }
    }

    games.set(interaction.user.id, { bet, player, dealer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hit").setLabel("HIT").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("stand").setLabel("STAND").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: `🃏 You: ${sum(player)} | Dealer: ${dealer[0]}`,
      components: [row],
    });
  },

  games,
  draw,
  sum,
};