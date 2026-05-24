const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  getVoiceConnection,
} = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play music")
    .addStringOption(option =>
      option
        .setName("song")
        .setDescription("Song name or URL")
        .setRequired(true)
    ),

  async execute(interaction, client) {

    try {

      if (!client.kazagumo) {
        return interaction.reply({
          content: "❌ Music system not ready",
          ephemeral: true,
        });
      }

      const voiceChannel =
        interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: "❌ Join a VC first",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      // 🔥 FORCE VC CONNECTION
      const existing =
        getVoiceConnection(interaction.guild.id);

      if (!existing) {
        return interaction.editReply(
          "❌ Bot VC connection missing"
        );
      }

      // 🔥 GET OR CREATE PLAYER
      let player =
        client.kazagumo.players.get(
          interaction.guild.id
        );

      if (!player) {

        player =
          await client.kazagumo.createPlayer({
            guildId: interaction.guild.id,
            textId: interaction.channel.id,
            voiceId: voiceChannel.id,
            deaf: true,
          });
      }

      // 🔥 SEARCH
      const query =
        interaction.options.getString("song");

      const result =
        await client.kazagumo.search(
          query,
          {
            requester: interaction.user,
          }
        );

      if (
        !result ||
        !result.tracks.length
      ) {
        return interaction.editReply(
          "❌ No results found"
        );
      }

      const track = result.tracks[0];

      // 🔥 ADD TO QUEUE
      player.queue.add(track);

      // 🔥 PLAY
      if (!player.playing && !player.paused) {
        await player.play();
      }

      return interaction.editReply({
        content:
          `🎵 Now playing: **${track.title}**`,
      });

    } catch (err) {

      console.log(
        "PLAY COMMAND ERROR:",
        err
      );

      return interaction.editReply({
        content: "❌ Music failed",
      }).catch(() => {});
    }
  },
};