const vc = interaction.member.voice.channel;
if (!vc) return interaction.reply("❌ Join VC first");

const player = kazagumo.createPlayer({
  guildId: interaction.guild.id,
  voiceId: vc.id,
  textId: interaction.channel.id,
  deaf: true,
});

let res;

try {
  res = await kazagumo.search(query, { requester: interaction.user });
} catch (e) {
  console.log(e);
  return interaction.reply("❌ Lavalink search failed");
}

if (!res.tracks.length)
  return interaction.reply("❌ No results found");

const track = res.tracks[0];

player.queue.add(track);

if (!player.playing) await player.play();

return interaction.reply(`🎵 Playing **${track.title}**`);