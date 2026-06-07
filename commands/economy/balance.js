const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

// simple color extractor from avatar
async function getDominantColor(user) {
  try {
    const url = user.displayAvatarURL({ extension: "png", size: 128 });

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // very simple color grab (fallback-safe)
    const bytes = new Uint8Array(buffer);

    let r = 0, g = 0, b = 0;
    let count = 0;

    for (let i = 0; i < bytes.length; i += 10) {
      r += bytes[i] || 0;
      g += bytes[i + 1] || 0;
      b += bytes[i + 2] || 0;
      count++;
    }

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    return (r << 16) + (g << 8) + b;
  } catch {
    return 0x2b2d31; // fallback dark gray
  }
}

function format(num = 0) {
  return num.toLocaleString();
}

async function getUser(id) {
  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({
      userId: id,
      perk: "None",
      perkLevel: 1,
      bank: 0,
      bankSpace: 10000,
      wallet: 0,
    });
  }

  if (typeof user.perkLevel !== "number") user.perkLevel = 1;

  return user;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 Check balance")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to check")
        .setRequired(false)
    ),

  async execute(interaction) {

    const target =
      interaction.options.getUser("user") ||
      interaction.user;

    const user = await getUser(target.id);

    const wallet = format(user.wallet);
    const bank = format(user.bank);
    const bankSpace = format(user.bankSpace);
    const total = format((user.wallet || 0) + (user.bank || 0));

    const perkName = user.perk || "None";
    const perkLevel = user.perkLevel || 1;

    const color = await getDominantColor(target);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`💰 ${target.username}'s Balance`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setDescription(
        [
          "━━━━━━━━━━━━━━━━━━",
          "",
          "💵 **Wallet Information**",
          `└ Cash: \`${wallet}\` coins`,
          "",
          "🏦 **Bank Information**",
          `└ Stored: \`${bank} / ${bankSpace}\``,
          "",
          "💎 **Total Wealth**",
          `└ \`${total}\` coins`,
          "",
          "⭐ **Perk Status**",
          `└ ${perkName} [Level ${perkLevel}]`,
          "",
          "━━━━━━━━━━━━━━━━━━"
        ].join("\n")
      )
      .setFooter({
        text: "Economy System • Balance Overview",
      });

    return interaction.reply({ embeds: [embed] });
  },
};