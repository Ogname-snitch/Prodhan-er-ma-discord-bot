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
    .setName("transfer")
    .setDescription("💸 Transfer money")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("Target")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName("amount")
        .setDescription("Amount")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser =
      interaction.options.getUser("user");

    const amount =
      interaction.options.getInteger("amount");

    if (amount <= 0)
      return interaction.reply("❌ Invalid amount");

    const user = await getUser(interaction.user.id);

    if (user.wallet < amount)
      return interaction.reply("❌ Not enough money");

    const target = await getUser(targetUser.id);

    user.wallet -= amount;
    target.wallet += amount;

    await user.save();
    await target.save();

    return interaction.reply(
      `💸 Sent ${amount} coins to <@${targetUser.id}>`
    );
  },
};