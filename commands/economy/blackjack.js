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

async function getUser(id) {
  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({
      userId: id,
    });
  }

  return user;
}

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
    const bet = interaction.options.getInteger("bet");

    const user = await getUser(interaction.user.id);

    if (bet <= 0)
      return interaction.reply("❌ Invalid bet");

   if (bet > 15000) {
  return interaction.reply("❌ Maximum bet is 15,000 coins");
}

if (bet <= 0)
  return interaction.reply("❌ Invalid bet");

if (user.wallet < bet)
  return interaction.reply("❌ Not enough money");

    const player = [draw(), draw()];
    const dealer = [draw(), draw()];

    games.set(interaction.user.id, {
      bet,
      player,
      dealer,
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("HIT")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("STAND")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      content: `🃏 You: ${sum(player)} | Dealer: ${dealer[0]}`,
      components: [row],
    });
  },

  games,
  getUser,
  sum,
  draw,
};