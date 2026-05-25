const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

async function getUser(id) {
  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({
      userId: id,
      perk: "None",
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

    const user =
      await getUser(target.id);

    const perk =
      user.perk || "None";

    return interaction.reply(
      `💰 ${target.username} has ${user.wallet} coins\n⭐ Perk: ${perk}`
    );
  },
};