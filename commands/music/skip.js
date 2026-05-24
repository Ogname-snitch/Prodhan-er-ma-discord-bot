const {
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip song"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(
      interaction.guild.id
    );

    if (!player)
      return interaction.reply("❌ No music");

    await player.skip();

    interaction.reply("⏭️ Skipped");
  },
};