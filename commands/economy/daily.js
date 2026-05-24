const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

const cooldown = 86400000;

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
    .setName("daily")
    .setDescription("🎁 Daily reward"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastDaily < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastDaily)) / 3600000
      );

      return interaction.reply(
        `⏳ Come back in ${left} hour(s)`
      );
    }

    user.wallet += 1000;
    user.lastDaily = now;

    await user.save();

    return interaction.reply(
      "🎁 You received 1000 coins"
    );
  },
};