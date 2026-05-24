const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

const cooldown = 30000;

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
    .setName("work")
    .setDescription("💼 Work for coins"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastWork < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastWork)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const amount =
      Math.floor(Math.random() * 500) + 300;

    user.wallet += amount;
    user.lastWork = now;

    await user.save();

    return interaction.reply(
      `💼 You earned ${amount} coins`
    );
  },
};