const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

const cooldown = 15000;

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
    .setName("beg")
    .setDescription("🥺 Beg for coins"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastBeg < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastBeg)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    const amount = Math.floor(Math.random() * 200);

    user.wallet += amount;
    user.lastBeg = now;

    await user.save();

    return interaction.reply(
      `🥺 Someone gave you ${amount} coins`
    );
  },
};