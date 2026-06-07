const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 60000;
const jailTime = 10 * 60 * 1000;

function formatTime(ms) {
  const sec = Math.ceil(ms / 1000);
  return `${sec}s`;
}

// ================= ROBBER PERK CALC =================
function getRobberMultiplier(level = 1) {
  if (level >= 4) return 1.45;
  if (level >= 3) return 1.40;
  if (level >= 2) return 1.35;
  return 1.30; // level 1
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

    // ================= COOLDOWN =================
    if (user.lastSteal && now - user.lastSteal < cooldown) {
      const left = formatTime(cooldown - (now - user.lastSteal));
      return interaction.reply(`⏳ Cooldown: **${left} remaining**`);
    }

    // ================= MASK CHECK =================
    const maskIndex = user.inventory.findIndex(
      i => i.item.toLowerCase() === "ski masks" && i.amount > 0
    );

    if (maskIndex === -1)
      return interaction.reply("❌ You need a ski mask");

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
      failChance = 0.5; // base perk definition you gave
    }

    // failure
    if (Math.random() < failChance) {
      user.jailUntil = now + jailTime;
      user.lastSteal = now;

      await user.save();

      return interaction.reply("🚨 Caught! You got sent to jail for 10 minutes");
    }

    // ================= STEAL CALC =================
    let maxSteal = Math.floor(target.wallet * 0.5);
    if (maxSteal < 1) maxSteal = 1;

    let stolen = Math.floor(Math.random() * maxSteal) + 1;

    // ================= PERK BOOST =================
    if (user.perk === "Robber") {
      const level = user.perkUpgrades || 1;
      const mult = getRobberMultiplier(level);

      stolen = Math.floor(stolen * mult);
    }

    // ================= SAFETY LIMIT =================
    stolen = Math.min(stolen, target.wallet);

    // ================= TRANSFER =================
    target.wallet -= stolen;
    user.wallet += stolen;

    user.lastSteal = now;

    await user.save();
    await target.save();

    return interaction.reply(
      `🕵️ You stole **${stolen.toLocaleString()} coins** from ${targetUser.username}`
    );
  },
};