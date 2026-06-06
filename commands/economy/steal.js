const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 60000;
const jailTime = 10 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("steal")
    .setDescription("🕵️ Steal coins")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Target")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");

    if (targetUser.id === interaction.user.id)
      return interaction.reply("❌ You can't steal from yourself");

    const user = await User.getUser(interaction.user.id);
    const target = await User.getUser(targetUser.id);

    const now = Date.now();

    if (user.jailUntil > now)
      return interaction.reply(`🚔 You're in jail`);

    const maskIndex = user.inventory.findIndex(
      i => i.item === "ski masks" && i.amount > 0
    );

    if (maskIndex === -1)
      return interaction.reply("❌ You need a ski mask");

    // consume mask
    user.inventory[maskIndex].amount--;
    if (user.inventory[maskIndex].amount <= 0)
      user.inventory.splice(maskIndex, 1);

    user.markModified("inventory");

    if (now - user.lastSteal < cooldown)
      return interaction.reply("⏳ Cooldown");

    if (target.wallet <= 0)
      return interaction.reply("❌ Target has no money");

    let failChance = 0.35;

    // 🟣 Robber perk
    if (user.perk === "Robber") {
      failChance = 0.175; // 50% lower
    }

    if (Math.random() < failChance) {
      user.jailUntil = now + jailTime;
      user.lastSteal = now;
      await user.save();

      return interaction.reply("🚨 Caught!");
    }

    let stolen = Math.floor(Math.random() * target.wallet);

    if (user.perk === "Robber") {
      stolen = Math.floor(stolen * 1.3);
    }

    target.wallet -= stolen;
    user.wallet += stolen;

    user.lastSteal = now;

    await user.save();
    await target.save();

    return interaction.reply(`🕵️ Stole ${stolen} coins`);
  },
};