const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 60000; // 1 minute
const jailTime = 10 * 60 * 1000; // 10 minutes

async function getUser(id) {
  return await User.getUser(id);
}

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

    if (targetUser.id === interaction.user.id) {
      return interaction.reply("❌ You can't steal from yourself");
    }

    const user = await getUser(interaction.user.id);
    const target = await getUser(targetUser.id);

    const now = Date.now();

    // 🚔 JAIL CHECK
    if (user.jailUntil && user.jailUntil > now) {
      const left = Math.ceil((user.jailUntil - now) / 1000);
      return interaction.reply(`🚔 You're in jail for ${left}s`);
    }

    // 🎭 SKI MASK CHECK + CONSUME
    const maskIndex = user.inventory.findIndex(
      i => i.item === "ski masks" && i.amount > 0
    );

    if (maskIndex === -1) {
      return interaction.reply("❌ You need a ski mask to steal");
    }

    // consume 1 mask
    user.inventory[maskIndex].amount -= 1;
    if (user.inventory[maskIndex].amount <= 0) {
      user.inventory.splice(maskIndex, 1);
    }
    user.markModified("inventory");

    // ⏳ COOLDOWN CHECK
    if (now - user.lastSteal < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastSteal)) / 1000);
      return interaction.reply(`⏳ Wait ${left} seconds`);
    }

    if (target.wallet <= 0) {
      return interaction.reply("❌ Target has no money");
    }

    // 🎲 FAIL CHANCE SYSTEM
    let failChance = 0.50;

    if (user.perk === "Robber") {
      failChance = 0.15;
    }

    const failed = Math.random() < failChance;

    if (failed) {
      user.jailUntil = now + jailTime;
      user.lastSteal = now;

      await user.save();

      return interaction.reply(
        "🚨 You got caught! Sent to jail for 10 minutes."
      );
    }

    const stolen = Math.floor(Math.random() * Math.max(1, target.wallet));

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