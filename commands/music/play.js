const {
  SlashCommandBuilder,
} = require("discord.js");

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

      // 🔥 CHECK NODE
      if (!client.kazagumo?.shoukaku?.nodes?.size) {
        return interaction.reply({
          content: "❌ Lavalink node not connected",
          ephemeral: true,
        });
      }

      const memberChannel =
        interaction.member.voice.channel;

      if (!memberChannel) {
        return interaction.reply({
          content: "❌ Join a voice channel first",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const query =
        interaction.options.getString("song");

      // 🔥 CREATE PLAYER
      let player =
        client.kazagumo.players.get(
          interaction.guild.id
        );

      if (!player) {

        player =
          await client.kazagumo.createPlayer({
            guildId: interaction.guild.id,
            textId: interaction.channel.id,
            voiceId: memberChannel.id,
            deaf: true,
          });
      }

      // 🔥 SEARCH
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

      // 🔥 START PLAYING
      if (!player.playing && !player.paused) {
        player.play();
      }

      return interaction.editReply({
        content:
          `🎵 Now playing: **${track.title}**`,
      });

    } catch (err) {

      console.log("PLAY COMMAND ERROR:", err);

      if (interaction.deferred || interaction.replied) {

        return interaction.editReply({
          content: "❌ Music failed",
        }).catch(() => {});

      } else {

        return interaction.reply({
          content: "❌ Music failed",
          ephemeral: true,
        }).catch(() => {});
      }
    }
  },
};