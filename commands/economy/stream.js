const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 300000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stream")
    .setDescription("📹 Stream games"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastStream < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastStream)) / 1000
      );

      return interaction.reply(`⏳ Wait ${left}s`);
    }

    const setup = user.inventory.find(
      i => i.item === "streaming equipment"
    );

    const games = user.inventory.find(
      i => i.item === "games"
    );

    if (!setup || !games) {
      return interaction.reply(
        "❌ You need streaming equipment and games"
      );
    }

    const amount =
      Math.floor(Math.random() * 9991) + 10;

    user.wallet += amount;
    user.lastStream = now;

    await user.save();

    return interaction.reply(
      `📹 Your stream earned ${amount} coins`
    );
  },
};