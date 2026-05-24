const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 60000; // normal steal cooldown (1 min)
const jailTime = 100 * 60 * 1000; // 10 minutes jail

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

    // 🟥 CHECK JAIL STATUS
    if (user.jailUntil && now < user.jailUntil) {
      const left = Math.ceil((user.jailUntil - now) / 1000);
      return interaction.reply(`🚔 You are in jail for ${left}s`);
    }

    // ⏳ COOLDOWN CHECK
    if (now - user.lastSteal < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastSteal)) / 1000);
      return interaction.reply(`⏳ Wait ${left} seconds`);
    }

    if (target.wallet <= 0) {
      return interaction.reply("❌ Target has no money");
    }

    // 🎲 FAIL CHANCE (DEFAULT 30%)
    let failChance = 0.30;

    // 🟣 PERK: ROBBER reduces fail chance to 15%
    if (user.perk === "Robber") {
      failChance = 0.15;
    }

    const failed = Math.random() < failChance;

    // ❌ FAILED → GO TO JAIL
    if (failed) {
      user.jailUntil = now + jailTime;
      user.lastSteal = now;

      await user.save();

      return interaction.reply(
        `🚨 You got caught and sent to jail for 10 minutes!`
      );
    }

    // 💰 SUCCESS STEAL
    const stolen = Math.floor(Math.random() * target.wallet);

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