const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

function getRequiredXP(level) {
  return 50 + (level * 10);
}

function createBar(xp, required, size = 10) {
  const progress = Math.floor((xp / required) * size);
  const filled = "█".repeat(progress);
  const empty = "░".repeat(size - progress);
  return `${filled}${empty} ${Math.floor((xp / required) * 100)}%`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("level")
    .setDescription("📊 Check your level, XP, and points")
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

    const user = await User.findOne({ userId: target.id });

    if (!user) {
      return interaction.reply("❌ User not found");
    }

    const level = user.level || 0;
    const xp = user.xp || 0;
    const points = user.points || 0;

    const required = getRequiredXP(level);
    const bar = createBar(xp, required);

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${target.username}'s Level`)
      .setColor(0x5865F2)
      .addFields(
        { name: "⭐ Level", value: `${level}`, inline: true },
        { name: "📈 XP", value: `${xp} / ${required}`, inline: true },
        { name: "🎁 Points", value: `${points}`, inline: true },
        { name: "📊 Progress", value: `\`${bar}\``, inline: false }
      )
      .setFooter({ text: "Leveling System" });

    return interaction.reply({ embeds: [embed] });
  },
};