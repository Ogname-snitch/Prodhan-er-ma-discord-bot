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

    // 🔒 GLOBAL BUTTON SECURITY (ADDED)
    const ownerId =
      interaction.message?.interaction?.user?.id ||
      interaction.message?.interactionUser?.id ||
      interaction.message?.author?.id;

    if (ownerId && interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "❌ This is not your interaction.",
        ephemeral: true,
      }).catch(() => {});
    }

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
    // 🃏 BLACKJACK (FIXED EMBED UI)
    // =========================
    if (interaction.customId === "hit" || interaction.customId === "stand") {

      const blackjack = client.commands.get("blackjack");
      if (!blackjack) return interaction.deferUpdate().catch(() => {});

      const games = blackjack.games || global.blackjackGames;
      const game = games?.get(interaction.user.id);

      if (!game) return interaction.deferUpdate().catch(() => {});

      await interaction.deferUpdate().catch(() => {});

      let user;

      try {
        const User = require("../utils/database");
        user = await User.getUser(interaction.user.id);
      } catch (err) {
        console.log("Blackjack user fetch error:", err);
        return interaction.editReply({
          content: "❌ Blackjack error (user load failed)",
          components: [],
        }).catch(() => {});
      }

      const p = game.player;
      const d = game.dealer;

      const draw = blackjack.draw;
      const sum = blackjack.sum;

      try {

        if (interaction.customId === "hit") {

          p.push(draw());

          const ps = sum(p);

          if (ps > 21) {
            games.delete(interaction.user.id);

            user.wallet -= game.bet;
            await user.save();

            return interaction.editReply({
              embeds: [
                {
                  color: 0xff0000,
                  title: "💥 BUST!",
                  description: `You went over 21\n\n💸 Lost **${game.bet.toLocaleString()} coins**`,
                  footer: { text: "🃏 Blackjack Table" },
                },
              ],
              components: [],
            }).catch(() => {});
          }

          return interaction.editReply({
            embeds: [
              {
                color: 0x111111,
                title: "🃏 BLACKJACK TABLE",
                description: [
                  "━━━━━━━━━━━━━━━━",
                  "",
                  `🧑 **You:** ${ps}`,
                  `🎩 **Dealer:** ${d[0]}`,
                  "",
                  "━━━━━━━━━━━━━━━━",
                  "🎲 Game in progress...",
                ].join("\n"),
              },
            ],
            components: interaction.message.components,
          }).catch(() => {});
        }

        if (interaction.customId === "stand") {

          while (sum(d) < 17) {
            d.push(draw());
          }

          const ps = sum(p);
          const ds = sum(d);

          games.delete(interaction.user.id);

          let result;

          if (ds > 21 || ps > ds) {
            user.wallet += game.bet;
            result = `🎉 YOU WIN **${game.bet.toLocaleString()} coins**`;
          } else if (ps < ds) {
            user.wallet -= game.bet;
            result = `💀 YOU LOSE **${game.bet.toLocaleString()} coins**`;
          } else {
            result = "🤝 PUSH (TIE)";
          }

          await user.save();

          return interaction.editReply({
            embeds: [
              {
                color: 0x00ff99,
                title: "🃏 BLACKJACK RESULTS",
                description: [
                  "━━━━━━━━━━━━━━━━",
                  "",
                  `🧑 **You:** ${ps}`,
                  `🎩 **Dealer:** ${ds}`,
                  "",
                  "━━━━━━━━━━━━━━━━",
                  result,
                ].join("\n"),
              },
            ],
            components: [],
          }).catch(() => {});
        }

      } catch (err) {
        console.log("Blackjack interaction error:", err);

        return interaction.editReply({
          content: "❌ Blackjack system error",
          components: [],
        }).catch(() => {});
      }
    }

    interaction.client._getEcoMultiplier = getEconomyMultiplier;
    interaction.client._getFishMultiplier = getFishMultiplier;
  });
};