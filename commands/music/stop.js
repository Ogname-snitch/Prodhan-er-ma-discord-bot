const {
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop music"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(
      interaction.guild.id
    );

    if (!player)
      return interaction.reply("❌ No music");

    player.queue.clear();

    await player.skip().catch(() => {});

    interaction.reply("🛑 Stopped");
  },
};