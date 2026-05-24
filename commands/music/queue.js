const {
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Music queue"),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(
      interaction.guild.id
    );

    if (!player)
      return interaction.reply("❌ No music");

    const q = player.queue;

    if (!q.size)
      return interaction.reply("📭 Empty");

    const msg = q
      .slice(0, 10)
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join("\n");

    interaction.reply(msg);
  },
};