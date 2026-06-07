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

// ================= CASINO UI HELPERS =================
const vibes = [
  "🎰 The table is tense...",
  "🃏 The dealer is watching you closely...",
  "💰 High stakes... no mercy...",
  "🔥 The crowd is holding its breath...",
  "🎲 Fortune is deciding your fate...",
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

    // ================= INITIAL HANDS =================
    let player = [draw(), draw()];
    const dealer = [draw(), draw()];

    // ⭐ PERK BONUS (Alcoholic instant strong hand chance)
    if (user.perk === "Alcoholic") {
      const lvl = user.perkLevel || 1;
      const chance = 0.20 + (lvl - 1) * 0.05;

      if (Math.random() < chance) {
        player = [10, 11]; // near blackjack
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
      .setColor(0x0f0f0f)
      .setTitle("🃏 BLACKJACK TABLE")
      .setDescription(
        [
          "━━━━━━━━━━━━━━━━━━━━",
          "",
          `💰 **Bet:** \`${bet.toLocaleString()} coins\``,
          "",
          `🧑 **Your Hand:** \`${sum(player)}\``,
          `🎩 **Dealer Shows:** \`${dealer[0]}\``,
          "",
          "━━━━━━━━━━━━━━━━━━━━",
          "",
          `🎲 *${vibe}*`,
        ].join("\n")
      )
      .setImage(
        "https://tenor.com/view/luigi-casino-gif-18158832090148544636"
      )
      .setFooter({ text: "Casino Royale • Blackjack Table" });

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },

  games,
  draw,
  sum,
};