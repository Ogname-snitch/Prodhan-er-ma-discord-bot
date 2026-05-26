const { Events } = require("discord.js");

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {

    // =========================
    // SLASH COMMANDS
    // =========================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.log("❌ Command not found:", interaction.commandName);
        console.log("📦 Available commands:", [...client.commands.keys()]);

        return interaction.reply({
          content: "❌ Command not found",
          ephemeral: true,
        });
      }

      if (typeof command.execute !== "function") {
        console.log(`❌ Command missing execute(): ${interaction.commandName}`);

        return interaction.reply({
          content: "❌ Command misconfigured (no execute function)",
          ephemeral: true,
        });
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.log(`❌ Command Error (${interaction.commandName}):`, err);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "❌ Error while executing command",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "❌ Error while executing command",
            ephemeral: true,
          });
        }
      }
    }

    // =========================
    // BUTTONS ROUTER (FIXED)
    // =========================
    if (interaction.isButton()) {

      // =========================
      // 🏦 BANKROB SYSTEM (NEW FIX)
      // =========================
      if (
        interaction.customId === "accept_bankrob" ||
        interaction.customId === "decline_bankrob"
      ) {

        // Let bankrob command handle it via collector
        // (IMPORTANT: do NOT send "no blackjack game")

        return; // stop here so blackjack doesn't catch it
      }

      // =========================
      // 🃏 BLACKJACK SYSTEM (UNCHANGED)
      // =========================
      if (
        interaction.customId === "hit" ||
        interaction.customId === "stand"
      ) {

        const blackjack = client.commands.get("blackjack");

        if (!blackjack) {
          console.log("❌ Blackjack command not found in collection");
          return;
        }

        const game = blackjack.games?.get(interaction.user.id);

        if (!game) {
          return interaction.reply({
            content: "❌ No blackjack game",
            ephemeral: true,
          });
        }

        let user;
        try {
          user = await blackjack.getUser(interaction.user.id);
        } catch (err) {
          console.log("❌ DB error in blackjack:", err);

          return interaction.reply({
            content: "❌ Database error",
            ephemeral: true,
          });
        }

        const p = game.player;
        const d = game.dealer;

        // HIT
        if (interaction.customId === "hit") {

          p.push(blackjack.draw());

          if (blackjack.sum(p) > 21) {

            blackjack.games.delete(interaction.user.id);

            user.wallet -= game.bet;
            await user.save();

            return interaction.update({
              content: `💥 Bust! You lost ${game.bet} coins`,
              components: [],
            });
          }

          return interaction.update({
            content: `🃏 You: ${blackjack.sum(p)} | Dealer: ${d[0]}`,
            components: interaction.message.components,
          });
        }

        // STAND
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
          });
        }
      }
    }
  });
};