const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const {
  blackjack,
  draw,
  sum,
} = require("../../utils/blackjack");

const {
  getUser,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("🃏 Blackjack")
    .addIntegerOption(o =>
      o
        .setName("bet")
        .setDescription("Bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = await getUser(
      interaction.user.id
    );

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

    const player = [
      draw(),
      draw(),
    ];

    const dealer = [
      draw(),
      draw(),
    ];

    blackjack.set(
      interaction.user.id,
      {
        bet,
        player,
        dealer,
      }
    );

    const row =
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("hit")
          .setLabel("HIT")
          .setStyle(
            ButtonStyle.Success
          ),

        new ButtonBuilder()
          .setCustomId("stand")
          .setLabel("STAND")
          .setStyle(
            ButtonStyle.Danger
          )
      );

    interaction.reply({
      content: `🃏 You: ${sum(player)} | Dealer: ${dealer[0]}`,
      components: [row],
    });
  },
};