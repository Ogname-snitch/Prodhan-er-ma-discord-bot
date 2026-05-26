const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scam")
    .setDescription("🎁 Scam giftcards"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);

    const now = Date.now();

    if (now - user.lastScam < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastScam)) / 1000
      );

      return interaction.reply(`⏳ Wait ${left}s`);
    }

    const amount =
      Math.floor(Math.random() * 10) + 1;

    const existing = user.inventory.find(
      i => i.item === "giftcard"
    );

    if (existing) {
      existing.amount += amount;
    } else {
      user.inventory.push({
        item: "giftcard",
        amount,
      });
    }

    user.lastScam = now;

    await user.save();

    return interaction.reply(
      `🎁 You scammed ${amount} giftcards`
    );
  },
};