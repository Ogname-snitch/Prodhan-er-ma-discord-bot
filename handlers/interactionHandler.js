const { Events } = require("discord.js");

// ⚠️ FIX: safer require (adjust if needed)
let User;
try {
  User = require("../utils/database");
} catch (err) {
  console.log("❌ Database import failed in interactionHandler:", err);
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
      } catch (err) {
        console.log(`❌ Error in ${interaction.commandName}:`, err);

        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({
            content: "❌ Error executing command",
            ephemeral: true,
          }).catch(() => {});
        } else {
          return interaction.reply({
            content: "❌ Error executing command",
            ephemeral: true,
          }).catch(() => {});
        }
      }
    }

    // =========================
    // AUTOCOMPLETE (SAFE FIX)
    // =========================
    if (interaction.isAutocomplete()) {
      try {
        if (!User) return interaction.respond([]);

        const user = await User.getUser(interaction.user.id);

        const focused = interaction.options.getFocused()?.toLowerCase() || "";
        const items = user.inventory || [];

        const choices = items
          .map(i => i.item)
          .filter(i => typeof i === "string" && i.toLowerCase().includes(focused))
          .slice(0, 25);

        return interaction.respond(
          choices.map(c => ({ name: c, value: c }))
        );

      } catch (err) {
        console.log("❌ Autocomplete error:", err);
        return interaction.respond([]).catch(() => {});
      }
    }

    // =========================
    // BUTTONS
    // =========================
    if (!interaction.isButton()) return;

    if (interaction.customId === "hit" || interaction.customId === "stand") {

      const blackjack = client.commands.get("blackjack");
      if (!blackjack) return;

      const game = blackjack.games?.get(interaction.user.id);
      if (!game) {
        return interaction.reply({
          content: "❌ No blackjack game",
          ephemeral: true,
        }).catch(() => {});
      }

      let user;
      try {
        user = await blackjack.getUser(interaction.user.id);
      } catch (err) {
        console.log("❌ DB error blackjack:", err);
        return interaction.reply({
          content: "❌ Database error",
          ephemeral: true,
        }).catch(() => {});
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
          }).catch(() => {});
        }

        return interaction.update({
          content: `🃏 You: ${blackjack.sum(p)} | Dealer: ${d[0]}`,
          components: interaction.message.components,
        }).catch(() => {});
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
        }).catch(() => {});
      }
    }
  });
};