const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("🛒 View the economy shop"),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("🛒 Economy Shop")
      .setColor("Blue")
      .setDescription(
`💻 **Baking Equipment** — 5,000 coins
🔫 **Gun** — 10,000 coins
🪖 **Rifle** — 25,000 coins
🎣 **Fishing Rod** — 5,000 - 50,000 coins
📹 **Streaming Equipment** — 20,000 coins
🎮 **Games** — 10,000 coins
🎭 **Ski Masks** — 100 coins`
      )
      .setFooter({
        text: "More items coming soon",
      });

    return interaction.reply({
      embeds: [embed],
    });
  },
};