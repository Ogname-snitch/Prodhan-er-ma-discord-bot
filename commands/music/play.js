const {
  SlashCommandBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music")
    .addStringOption(o =>
      o
        .setName("song")
        .setDescription("Song")
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const query = interaction.options.getString("song");

    const vc = interaction.member.voice.channel;

    if (!vc)
      return interaction.reply("❌ Join VC first");

    await interaction.reply(`🔍 Searching ${query}`);

    try {
      let player = client.kazagumo.players.get(
        interaction.guild.id
      );

      if (!player) {
        player = await client.kazagumo.createPlayer({
          guildId: interaction.guild.id,
          textId: interaction.channel.id,
          voiceId: vc.id,
          deaf: true,
        });
      }

      const res = await client.kazagumo.search(query, {
        requester: interaction.user,
      });

      if (!res.tracks.length)
        return interaction.followUp("❌ No songs");

      const track = res.tracks[0];

      player.queue.add(track);

      if (!player.playing)
        await player.play();

      interaction.followUp(
        `🎵 Playing ${track.title}`
      );
    } catch (err) {
      console.log(err);

      interaction.followUp("❌ Music failed");
    }
  },
};