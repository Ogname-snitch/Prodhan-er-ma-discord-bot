const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

function format(num = 0) {
  return num.toLocaleString(); // adds commas
}

async function getUser(id) {
  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({
      userId: id,
      perk: "None",
      bank: 0,
      bankSpace: 1000,
      wallet: 0,
    });
  }

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

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(`💰 ${target.username}'s Wallet`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "💵 Cash",
          value: `\`${wallet}\` coins`,
          inline: true,
        },
        {
          name: "🏦 Bank",
          value: `\`${bank} / ${bankSpace}\``,
          inline: true,
        },
        {
          name: "💎 Total Wealth",
          value: `\`${total}\` coins`,
          inline: false,
        },
        {
          name: "⭐ Perk",
          value: `\`${user.perk || "None"}\``,
          inline: true,
        }
      )
      .setFooter({
        text: "Your Balance",
      });

    return interaction.reply({ embeds: [embed] });
  },
};