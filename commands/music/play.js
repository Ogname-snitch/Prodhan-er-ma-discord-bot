const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name or URL")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const query = interaction.options.getString("song");

   if (!client.kazagumo?.shoukaku?.nodes?.size) {
  return interaction.reply({
    content: "❌ Lavalink node not connected",
    ephemeral: true,
  });
}

    await interaction.reply(`🔎 Searching: **${query}**`);

    try {
      const player = await client.kazagumo.createPlayer({
        guildId: interaction.guild.id,
        voiceId: interaction.member.voice.channel.id,
        textId: interaction.channel.id,
        deaf: true,
      });

      await player.play(query);

      await interaction.editReply(`🎶 Now playing: **${query}**`);
    } catch (err) {
      console.log(err);

      await interaction.editReply("❌ Music failed");
    }
  }
};