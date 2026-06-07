const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 60000; // 1 min
const jailTime = 10 * 60 * 1000; // 10 min

function formatTime(ms) {
  const sec = Math.ceil(ms / 1000);
  return `${sec}s`;
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

    if (targetUser.id === interaction.user.id)
      return interaction.reply("❌ You can't steal from yourself");

    const user = await User.getUser(interaction.user.id);
    const target = await User.getUser(targetUser.id);

    const now = Date.now();

    // ================= JAIL CHECK =================
    if (user.jailUntil > now) {
      const left = formatTime(user.jailUntil - now);
      return interaction.reply(`🚔 You're in jail for **${left}**`);
    }

    // ================= COOLDOWN CHECK =================
    if (user.lastSteal && now - user.lastSteal < cooldown) {
      const left = formatTime(cooldown - (now - user.lastSteal));
      return interaction.reply(`⏳ Cooldown: **${left} remaining**`);
    }

    // ================= CHECK MASK =================
    const maskIndex = user.inventory.findIndex(
      i => i.item.toLowerCase() === "ski masks" && i.amount > 0
    );

    if (maskIndex === -1)
      return interaction.reply("❌ You need a ski mask");

    // consume mask
    user.inventory[maskIndex].amount--;

    if (user.inventory[maskIndex].amount <= 0)
      user.inventory.splice(maskIndex, 1);

    user.markModified("inventory");

    // ================= TARGET CHECK =================
    if (!target.wallet || target.wallet <= 0)
      return interaction.reply("❌ Target has no money");

    // ================= FAIL CHANCE =================
    let failChance = 0.35;

    if (user.perk === "Robber") {
      failChance = 0.175;
    }

    // ================= FAIL =================
    if (Math.random() < failChance) {
      user.jailUntil = now + jailTime;
      user.lastSteal = now;

      await user.save();

      return interaction.reply("🚨 Caught! You got sent to jail for 10 minutes");
    }

    // ================= SAFE STEAL AMOUNT =================
    let maxSteal = Math.floor(target.wallet * 0.5); // can only steal up to 50%
    if (maxSteal < 1) maxSteal = 1;

    let stolen = Math.floor(Math.random() * maxSteal) + 1;

    // perk boost
    if (user.perk === "Robber") {
      stolen = Math.floor(stolen * 1.3);
    }

    // FINAL SAFETY CHECK
    stolen = Math.min(stolen, target.wallet);

    // ================= TRANSFER =================
    target.wallet -= stolen;
    user.wallet += stolen;

    user.lastSteal = now;

    await user.save();
    await target.save();

    return interaction.reply(`🕵️ You stole **${stolen.toLocaleString()} coins** from ${targetUser.username}`);
  },
};