const { Events } = require("discord.js");
const User = require("../utils/database"); // keep this safe

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
        });
      }

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.log(`❌ Error in ${interaction.commandName}:`, err);

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: "❌ Error executing command",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content: "❌ Error executing command",
              ephemeral: true,
            });
          }
        } catch (e) {
          console.log("❌ Failed to send error reply:", e);
        }
      }
    }

    // =========================
    // AUTOCOMPLETE (FIXED SAFE VERSION)
    // =========================
    if (interaction.isAutocomplete()) {
      try {
        const user = await User.getUser(interaction.user.id);

        const focused = interaction.options.getFocused()?.toLowerCase() || "";
        const items = user.inventory || [];

        const choices = items
          .map(i => i.item)
          .filter(i => i && i.toLowerCase().includes(focused))
          .slice(0, 25);

        await interaction.respond(
          choices.map(c => ({
            name: c,
            value: c,
          }))
        );

      } catch (err) {
        console.log("❌ Autocomplete error:", err);

        // IMPORTANT: ALWAYS respond or Discord shows "interaction failed"
        try {
          await interaction.respond([]);
        } catch {}
      }
    }

    // =========================
    // BUTTONS ONLY
    // =========================
    if (!interaction.isButton()) return;

    // =========================
    // BLACKJACK SYSTEM (SAFE)
    // =========================
    if (interaction.customId === "hit" || interaction.customId === "stand") {

      const blackjack = client.commands.get("blackjack");

      if (!blackjack) {
        return interaction.reply({
          content: "❌ Blackjack not loaded",
          ephemeral: true,
        });
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
        console.log("❌ DB error:", err);
        return interaction.reply({
          content: "❌ Database error",
          ephemeral: true,
        });
      }

      const p = game.player;
      const d = game.dealer;

      // ================= HIT =================
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

      // ================= STAND =================
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
  });
};