const { SlashCommandBuilder } = require("discord.js");

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
      // ❌ MUSIC SYSTEM CHECK
      if (!client.kazagumo) {
        return interaction.reply({
          content: "❌ Music system not ready",
          ephemeral: true,
        });
      }

      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: "❌ Join a VC first",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const query = interaction.options.getString("song");

      // 🔍 SEARCH TRACK
      const result = await client.kazagumo.search(query, {
        requester: interaction.user,
      });

      if (!result || !result.tracks?.length) {
        return interaction.editReply("❌ No results found");
      }

      const track = result.tracks[0];

      // 🎧 GET OR CREATE PLAYER (SAFE FIX)
      let player = client.kazagumo.players.get(interaction.guild.id);

      if (!player) {
        player = await client.kazagumo.createPlayer({
          guildId: interaction.guild.id,
          textId: interaction.channel.id,
          voiceId: voiceChannel.id,
          deaf: true,
        });

        console.log("🔊 Player created");
      }

      // 🔥 IMPORTANT FIX:
      // DO NOT manually force connect() — Kazagumo handles it internally

      // If player exists but not connected, fix safely
      if (player.state === "DISCONNECTED") {
        try {
          await player.connect();
        } catch (err) {
          console.log("⚠️ Player reconnect failed:", err.message);
        }
      }

      // ➕ ADD TO QUEUE
      player.queue.add(track);

      // ▶️ PLAY IF IDLE
      if (!player.playing && !player.paused) {
        await player.play();
      }

      return interaction.editReply({
        content: `🎵 Now playing: **${track.title}**`,
      });

    } catch (err) {
      console.log("PLAY COMMAND ERROR:", err);

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply("❌ Music failed");
      }

      return interaction.reply({
        content: "❌ Music failed",
        ephemeral: true,
      });
    }
  },
};