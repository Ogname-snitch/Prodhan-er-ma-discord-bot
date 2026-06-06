const { Events } = require("discord.js");

// =========================
// SAFE DATABASE IMPORT
// =========================
let User = null;

try {
  User = require("../utils/database");
} catch (err) {
  console.log("❌ DATABASE LOAD FAILED:", err);
}

// =========================
// GLOBAL CRASH PROTECTION
// =========================
process.on("unhandledRejection", (err) => {
  console.log("❌ UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", (err) => {
  console.log("❌ UNCAUGHT EXCEPTION:", err);
});

module.exports = (client) => {
  client.on(Events.InteractionCreate, async (interaction) => {

    try {

      console.log("INTERACTION:", interaction.type, interaction.commandName || interaction.customId);

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
          console.log(`❌ COMMAND ERROR (${interaction.commandName}):`, err);

          return interaction.reply({
            content: "❌ Error executing command",
            ephemeral: true,
          }).catch(() => {});
        }
      }

      // =========================
      // AUTOCOMPLETE (100% SAFE)
      // =========================
      if (interaction.isAutocomplete()) {

        try {
          if (!User) return interaction.respond([]);

          const user = await User.getUser(interaction.user.id);

          const focused = interaction.options.getFocused();
          const items = user?.inventory || [];

          const choices = items
            .map(i => i?.item)
            .filter(Boolean)
            .filter(i =>
              i.toLowerCase().includes((focused || "").toLowerCase())
            )
            .slice(0, 25);

          return interaction.respond(
            choices.map(i => ({
              name: i,
              value: i,
            }))
          );

        } catch (err) {
          console.log("❌ AUTOCOMPLETE ERROR:", err);
          return interaction.respond([]).catch(() => {});
        }
      }

      // =========================
      // BUTTONS
      // =========================
      if (!interaction.isButton()) return;

      // =========================
      // BLACKJACK SYSTEM SAFE
      // =========================
      if (interaction.customId === "hit" || interaction.customId === "stand") {

        const blackjack = client.commands.get("blackjack");
        if (!blackjack) {
          return interaction.reply({
            content: "❌ Blackjack not loaded",
            ephemeral: true,
          }).catch(() => {});
        }

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
          console.log("❌ BLACKJACK DB ERROR:", err);

          return interaction.reply({
            content: "❌ Database error",
            ephemeral: true,
          }).catch(() => {});
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
            }).catch(() => {});
          }

          return interaction.update({
            content: `🃏 You: ${blackjack.sum(p)} | Dealer: ${d[0]}`,
            components: interaction.message.components,
          }).catch(() => {});
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
          }).catch(() => {});
        }
      }

    } catch (err) {
      console.log("❌ GLOBAL HANDLER CRASH:", err);

      // LAST RESORT SAFETY
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: "❌ Something went wrong",
            ephemeral: true,
          });
        } catch {}
      }
    }
  });
};