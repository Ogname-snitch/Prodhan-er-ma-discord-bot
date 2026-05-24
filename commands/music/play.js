const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  data: {
    name: "play",
    description: "Play music",
  },

  async execute(interaction) {
    const query = interaction.options.getString("song");
    const vc = interaction.member.voice.channel;

    if (!vc) {
      return interaction.reply("❌ Join a voice channel first");
    }

    await interaction.reply("🔍 Searching...");

    try {
      let player = interaction.client.kazagumo.players.get(interaction.guild.id);

      if (!player) {
        player = await interaction.client.kazagumo.createPlayer({
          guildId: interaction.guild.id,
          voiceId: vc.id,
          textId: interaction.channel.id,
          deaf: true,
        });
      }

      // IMPORTANT FIX: ensure connection exists
      if (!player.voiceId) {
        await player.connect();
      }

      const result = await interaction.client.kazagumo.search(query, {
        requester: interaction.user,
      });

      if (!result?.tracks?.length) {
        return interaction.editReply("❌ No results found");
      }

      const track = result.tracks[0];

      player.queue.add(track);

      if (!player.playing && !player.paused) {
        await player.play();
      }

      return interaction.editReply(`🎵 Now playing **${track.title}**`);
    } catch (err) {
      console.log("PLAY ERROR:", err);

      return interaction.editReply(
        "❌ Music failed (Lavalink not connected or misconfigured)"
      );
    }
  },
};