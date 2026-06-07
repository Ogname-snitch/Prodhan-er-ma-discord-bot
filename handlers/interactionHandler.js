const { Events } = require("discord.js");
const User = require("../utils/database");

function getRequiredXP(level) {
  return 50 + (level * 10);
}

function getLevelReward(level) {
  if (level === 1) return 30;
  if (level === 2) return 35;
  if (level === 3) return 40;
  if (level === 4) return 50;
  if (level === 5) return 60;
  return 60;
}

// ⭐ NEW: level buff helpers
function getEconomyMultiplier(level) {
  if (level >= 15) return 1.4;
  if (level >= 5) return 1.2;
  return 1;
}

function getFishMultiplier(level) {
  if (level >= 20) return 1.3;
  if (level >= 10) return 1.15;
  return 1;
}

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {

    // =========================
    // SLASH COMMANDS
    // =========================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          content: "❌ Command not found",
          ephemeral: true,
        }).catch(() => {});
      }

      try {
        await command.execute(interaction, client);

        // =========================
        // LEVEL SYSTEM (FIXED CLEAN VERSION)
        // =========================
        const user = await User.getUser(interaction.user.id);

        const noXpCommands = [
          "level",
          "balance",
          "leaderboard",
          "sell",
          "buy",
          "shop",
          "xpshop",
        ];

        if (!noXpCommands.includes(interaction.commandName)) {

          user.xp = (user.xp || 0) + 1;

          let required = getRequiredXP(user.level);

          while (user.xp >= required) {
            user.xp -= required;
            user.level += 1;

            const reward = getLevelReward(user.level);
            user.points = (user.points || 0) + reward;

            interaction.channel?.send(
              `🎉 ${interaction.user} reached **Level ${user.level}**!\n⭐ +${reward} points`
            ).catch(() => {});

            required = getRequiredXP(user.level);
          }

          await user.save();
        }

      } catch (err) {
        console.log("❌ Slash command error:", err);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "❌ Error executing command",
            ephemeral: true,
          }).catch(() => {});
        } else {
          await interaction.reply({
            content: "❌ Error executing command",
            ephemeral: true,
          }).catch(() => {});
        }
      }
    }

    // =========================
    // AUTOCOMPLETE
    // =========================
    if (interaction.isAutocomplete()) {
      try {
        const user = await User.getUser(interaction.user.id);

        const focused = interaction.options.getFocused().toLowerCase();
        const items = user.inventory || [];

        const choices = items
          .map(i => i.item)
          .filter(i => i && i.toLowerCase().includes(focused))
          .slice(0, 25);

        return interaction.respond(
          choices.map(c => ({ name: c, value: c }))
        );
      } catch (err) {
        console.log("❌ Autocomplete error:", err);
      }
    }

    // =========================
    // BUTTONS
    // =========================
    if (!interaction.isButton()) return;

    // SELL
    if (interaction.customId.startsWith("sell_")) {
      const sellCommand = client.commands.get("sell");

      if (!sellCommand?.sellHandler) {
        return interaction.reply({
          content: "❌ Sell system not loaded",
          ephemeral: true,
        }).catch(() => {});
      }

      try {
        return await sellCommand.sellHandler(interaction, User);
      } catch (err) {
        console.log("❌ Sell handler error:", err);
      }
    }

    // XP SHOP
    const xpShop = client.commands.get("xpshop");

    if (xpShop?.xpShopHandler) {
      try {
        const handled = await xpShop.xpShopHandler(interaction, User);
        if (handled !== false) return;
      } catch (err) {
        console.log("❌ XP Shop error:", err);
      }
    }
// =========================
// BLACKJACK (FIXED 100%)
// =========================
if (interaction.customId === "hit" || interaction.customId === "stand") {

 const blackjack = client.commands.get("blackjack");
const game = blackjack.games?.get(interaction.user.id);
  // 🚨 MUST ACK IMMEDIATELY (THIS IS THE FIX)
  await interaction.deferUpdate().catch(() => {});
  
  const user = await blackjack.getUser(interaction.user.id);

  const p = game.player;
  const d = game.dealer;

  try {

    // ================= HIT =================
    if (interaction.customId === "hit") {

      p.push(blackjack.draw());

      const ps = blackjack.sum(p);

      if (ps > 21) {
        blackjack.games.delete(interaction.user.id);

        user.wallet -= game.bet;
        await user.save();

        return interaction.editReply({
          content: `💥 **BUST!** You lost **${game.bet.toLocaleString()} coins**`,
          components: [],
        });
      }

      return interaction.editReply({
        content: `🃏 **You:** ${ps} | 🧠 Dealer shows: ${d[0]}`,
        components: [
          interaction.message.components?.[0] ?? interaction.message.components
        ],
      });
    }

    // ================= STAND =================
    if (interaction.customId === "stand") {

      while (blackjack.sum(d) < 17) {
        d.push(blackjack.draw());
      }

      const ps = blackjack.sum(p);
      const ds = blackjack.sum(d);

      blackjack.games.delete(interaction.user.id);

      let result;

      if (ds > 21 || ps > ds) {
        user.wallet += game.bet;
        result = `🎉 You WON **${game.bet.toLocaleString()} coins**`;
      } else if (ps < ds) {
        user.wallet -= game.bet;
        result = `💀 You LOST **${game.bet.toLocaleString()} coins**`;
      } else {
        result = "🤝 **PUSH (Tie)**";
      }

      await user.save();

      return interaction.editReply({
        content: `🃏 **You:** ${ps} | 🧠 Dealer: ${ds}\n\n${result}`,
        components: [],
      });
    }

  } catch (err) {
    console.log("Blackjack error:", err);
    return interaction.editReply({
      content: "❌ Blackjack error occurred",
      components: [],
    }).catch(() => {});
  }
}

    // expose multipliers
    interaction.client._getEcoMultiplier = getEconomyMultiplier;
    interaction.client._getFishMultiplier = getFishMultiplier;
  });
};