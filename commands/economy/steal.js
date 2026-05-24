const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

const cooldown = 60000;

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
    .setName("steal")
    .setDescription("🕵️ Steal coins")
    .addUserOption(o =>
      o
        .setName("user")
        .setDescription("Target")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser =
      interaction.options.getUser("user");

    if (targetUser.id === interaction.user.id) {
      return interaction.reply(
        "❌ You can't steal from yourself"
      );
    }

    const user = await getUser(interaction.user.id);
    const target = await getUser(targetUser.id);

    const now = Date.now();

    if (now - user.lastSteal < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastSteal)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left} seconds`
      );
    }

    if (target.wallet <= 0) {
      return interaction.reply(
        "❌ Target has no money"
      );
    }

    const stolen = Math.floor(
      Math.random() * target.wallet
    );

    target.wallet -= stolen;
    user.wallet += stolen;
    user.lastSteal = now;

    await user.save();
    await target.save();

    return interaction.reply(
      `🕵️ You stole ${stolen} coins from <@${targetUser.id}>`
    );
  },
};