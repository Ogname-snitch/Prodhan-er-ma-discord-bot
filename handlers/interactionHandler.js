const { Events } = require("discord.js");

// safe import
const User = require("../utils/database");

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

    // ================= SELL SYSTEM =================
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

        return interaction.reply({
          content: "❌ Sell failed",
          ephemeral: true,
        }).catch(() => {});
      }
    }

    // ================= BLACKJACK =================
    if (interaction.customId === "hit" || interaction.customId === "stand") {

      const blackjack = client.commands.get("blackjack");
      if (!blackjack) return;

      const game = blackjack.games?.get(interaction.user.id);
      if (!game) return;

      const user = await blackjack.getUser(interaction.user.id);

      const p = game.player;
      const d = game.dealer;

      if (interaction.customId === "hit") {

        p.push(blackjack.draw());

        if (blackjack.sum(p) > 21) {
          blackjack.games.delete(interaction.user.id);

          user.wallet -= game.bet;
          await user.save();

          return interaction.update({
            content: `💥 Bust! You lost ${game.bet} coins`,
            components: [],
          }).catch(() => {});
        }

        return interaction.update({
          content: `🃏 You: ${blackjack.sum(p)} | Dealer: ${d[0]}`,
          components: interaction.message.components,
        }).catch(() => {});
      }

      if (interaction.customId === "stand") {

        while (blackjack.sum(d) < 17) {
          d.push(blackjack.draw());
        }

        const ps = blackjack.sum(p);
        const ds = blackjack.sum(d);

        blackjack.games.delete(interaction.user.id);

        let result = "";

        if (ds > 21 || ps > ds) {
          user.wallet += game.bet;
          result = `🎉 You won ${game.bet} coins`;
        } else if (ps < ds) {
          user.wallet -= game.bet;
          result = `💀 You lost ${game.bet} coins`;
        } else {
          result = "🤝 Tie";
        }

        await user.save();

        return interaction.update({
          content: `🃏 You: ${ps} | Dealer: ${ds}\n${result}`,
          components: [],
        }).catch(() => {});
      }
    }
  });
};