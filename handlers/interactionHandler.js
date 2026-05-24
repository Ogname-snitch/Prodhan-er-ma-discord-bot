const {
  Events,
} = require("discord.js");

module.exports = (client) => {
  client.on(
    Events.InteractionCreate,
    async (interaction) => {

      // SLASH COMMANDS
      if (interaction.isChatInputCommand()) {

        const command =
          client.commands.get(
            interaction.commandName
          );

        if (!command) {
          return interaction.reply({
            content: "❌ Command not found",
            ephemeral: true,
          });
        }

        try {
          await command.execute(interaction, client);
        } catch (err) {
          console.log(
            `❌ Command Error (${interaction.commandName}):`,
            err
          );

          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content:
                "❌ Error while executing command",
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content:
                "❌ Error while executing command",
              ephemeral: true,
            });
          }
        }
      }

      // BUTTONS (BLACKJACK)
      if (interaction.isButton()) {

        const blackjack =
          client.commands.get("blackjack");

        if (!blackjack)
          return;

        const game =
          blackjack.games.get(
            interaction.user.id
          );

        if (!game) {
          return interaction.reply({
            content:
              "❌ No blackjack game",
            ephemeral: true,
          });
        }

        const user =
          await blackjack.getUser(
            interaction.user.id
          );

        const p = game.player;
        const d = game.dealer;

        // HIT
        if (
          interaction.customId === "hit"
        ) {

          p.push(blackjack.draw());

          if (
            blackjack.sum(p) > 21
          ) {

            blackjack.games.delete(
              interaction.user.id
            );

            user.wallet -= game.bet;

            await user.save();

            return interaction.update({
              content:
                `💥 Bust! You lost ${game.bet} coins`,
              components: [],
            });
          }

          return interaction.update({
            content:
              `🃏 You: ${blackjack.sum(p)} | Dealer: ${d[0]}`,
            components:
              interaction.message.components,
          });
        }

        // STAND
        if (
          interaction.customId === "stand"
        ) {

          while (
            blackjack.sum(d) < 17
          ) {
            d.push(
              blackjack.draw()
            );
          }

          const ps =
            blackjack.sum(p);

          const ds =
            blackjack.sum(d);

          blackjack.games.delete(
            interaction.user.id
          );

          let result = "";

          if (
            ds > 21 ||
            ps > ds
          ) {

            user.wallet += game.bet;

            result =
              `🎉 You won ${game.bet} coins`;

          } else if (
            ps < ds
          ) {

            user.wallet -= game.bet;

            result =
              `💀 You lost ${game.bet} coins`;

          } else {

            result = "🤝 Tie";
          }

          await user.save();

          return interaction.update({
            content:
              `🃏 You: ${ps} | Dealer: ${ds}\n${result}`,
            components: [],
          });
        }
      }
    }
  );
};