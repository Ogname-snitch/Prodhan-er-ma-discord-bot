const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

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
    .setName("balance")
    .setDescription("💰 Check balance"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    return interaction.reply(
      `💰 You have ${user.wallet} coins`
    );
  },
};