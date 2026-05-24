const {
  blackjack,
  draw,
  sum,
} = require("../utils/blackjack");

const {
  getUser,
  saveUser,
} = require("../utils/database");

module.exports = (client) => {
  client.on("interactionCreate", async interaction => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(
        interaction.commandName
      );

      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.log(err);
      }
    }

    if (interaction.isButton()) {
      const game = blackjack.get(interaction.user.id);

      if (!game) {
        return interaction.reply({
          content: "❌ No blackjack game",
          ephemeral: true,
        });
      }

      const user = await getUser(interaction.user.id);

      const p = game.player;
      const d = game.dealer;

      if (interaction.customId === "hit") {
        p.push(draw());

        if (sum(p) > 21) {
          blackjack.delete(interaction.user.id);

          user.wallet -= game.bet;

          await saveUser(interaction.user.id, user);

          return interaction.update({
            content: `💥 Bust! Lost ${game.bet}`,
            components: [],
          });
        }

        return interaction.update({
          content: `🃏 You: ${sum(p)} | Dealer: ${d[0]}`,
          components: interaction.message.components,
        });
      }

      if (interaction.customId === "stand") {
        while (sum(d) < 17) d.push(draw());

        const ps = sum(p);
        const ds = sum(d);

        blackjack.delete(interaction.user.id);

        let result = "";

        if (ds > 21 || ps > ds) {
          user.wallet += game.bet;
          result = `🎉 Won ${game.bet}`;
        } else if (ps < ds) {
          user.wallet -= game.bet;
          result = `💀 Lost ${game.bet}`;
        } else {
          result = "🤝 Tie";
        }

        await saveUser(interaction.user.id, user);

        return interaction.update({
          content: `🃏 You: ${ps} | Dealer: ${ds}\n${result}`,
          components: [],
        });
      }
    }
  });
};