const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const User = require("../../utils/database");

const games = new Map();

function draw() {
  return Math.floor(Math.random() * 11) + 1;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

const vibes = [
  "🎰 The table is tense...",
  "🃏 Dealer is calculating your doom...",
  "💰 High stakes… no backing out now...",
  "🔥 Luck is bending reality...",
  "🎲 Fortune is watching you closely...",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("🃏 Casino Blackjack")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("Place your bet")
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const user = await User.getUser(interaction.user.id);

    if (bet <= 0)
      return interaction.reply({ content: "❌ Invalid bet", ephemeral: true });

    if (user.wallet < bet)
      return interaction.reply({ content: "❌ Not enough money", ephemeral: true });

    let player = [draw(), draw()];
    const dealer = [draw(), draw()];

    // ⭐ Alcoholic perk bonus
    if (user.perk === "Alcoholic") {
      const lvl = user.perkLevel || 1;
      const chance = 0.20 + (lvl - 1) * 0.05;

      if (Math.random() < chance) {
        player = [10, 11];
      }
    }

    games.set(interaction.user.id, { bet, player, dealer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("hit")
        .setLabel("HIT")
        .setEmoji("🃏")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("stand")
        .setLabel("STAND")
        .setEmoji("🛑")
        .setStyle(ButtonStyle.Danger)
    );

    const vibe = vibes[Math.floor(Math.random() * vibes.length)];

    const embed = new EmbedBuilder()
      .setColor(0x111111)
      .setTitle("🃏 BLACKJACK CASINO TABLE")
      .setDescription(
        [
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          `💰 **Bet Placed:** \`${bet.toLocaleString()} coins\``,
          "",
          `🧑 **Your Hand:** \`${sum(player)}\``,
          `🎩 **Dealer Shows:** \`${dealer[0]}\``,
          "",
          "━━━━━━━━━━━━━━━━━━━━━━",
          "",
          `🎲 *${vibe}*`,
        ].join("\n")
      )
      .setImage("https://media.tenor.com/5c0q6qv5Qv0AAAAC/luigi-casino.gif")
      .setFooter({ text: "🎰 Luigi Casino • Blackjack Table" });

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },

  games,
  draw,
  sum,
};