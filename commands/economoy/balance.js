const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  getUser,
} = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 Check balance"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    interaction.reply(
      `💰 You have ${user.wallet} coins`
    );
  },
};