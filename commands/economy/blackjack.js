const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const User = require("../../utils/database");

global.blackjackGames = global.blackjackGames || new Map();
const games = global.blackjackGames;

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

// ✅ FIXED GIF (reliable CDN)
const LUIGI_GIF =
  "https://media.tenor.com/5KX7qQ8qv1oAAAAC/squirrel-casino.gif";

// 🎮 button builder (IMPORTANT FIX)
function getButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("hit")
      .setLabel("HIT")
      .setEmoji("🃏")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),

    new ButtonBuilder()
      .setCustomId("stand")
      .setLabel("STAND")
      .setEmoji("🛑")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

// 🎰 embed builder (IMPORTANT FIX)
function buildEmbed({ bet, player, dealer, vibe, result = null }) {
  const ps = sum(player);

  return new EmbedBuilder()
    .setColor(0x111111)
    .setTitle("🃏 BLACKJACK CASINO TABLE")
    .setDescription(
      [
        "━━━━━━━━━━━━━━━━━━━━━━",
        "",
        `💰 **Bet:** \`${bet.toLocaleString()} coins\``,
        "",
        `🧑 **You:** \`${ps}\``,
        `🎩 **Dealer:** \`${dealer[0]}\``,
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "",
        result ? `🏆 ${result}` : `🎲 *${vibe}*`,
      ].join("\n")
    )
    .setImage(LUIGI_GIF)
    .setFooter({ text: "🎰 Squirrel Casino • Blackjack Table" });
}

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

    // ⭐ Alcoholic perk
    if (user.perk === "Alcoholic") {
      const lvl = user.perkLevel || 1;
      const chance = 0.20 + (lvl - 1) * 0.05;

      if (Math.random() < chance) {
        player = [10, 11];
      }
    }

    games.set(interaction.user.id, { bet, player, dealer });

    const vibe = vibes[Math.floor(Math.random() * vibes.length)];

    return interaction.reply({
      embeds: [buildEmbed({ bet, player, dealer, vibe })],
      components: [getButtons(false)],
    });
  },

  games,
  draw,
  sum,
  getButtons,
  buildEmbed,
};